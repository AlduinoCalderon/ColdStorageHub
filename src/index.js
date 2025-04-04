// src/index.js (actualizado para integrar MongoDB/MQTT sin romper Express)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
require('dotenv').config();

// MySQL config
const { sequelize, testConnection: testMySQLConnection } = require('./config/mysql');
const warehouseRoutes = require('./api/mysql/routes/warehouse.routes');
const storageUnitRoutes = require('./api/mysql/routes/storage-unit.routes');
const bookingRoutes = require('./api/mysql/routes/booking.routes');
const userRoutes = require('./api/mysql/routes/user.routes');
const paymentRoutes = require('./api/mysql/routes/payment.routes');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Configuración MQTT
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Asegurar que la URL tenga el protocolo
const mqttUrl = MQTT_BROKER_URL.startsWith('mqtt://') ? MQTT_BROKER_URL : `mqtt://${MQTT_BROKER_URL}`;
console.log('Conectando a MQTT:', mqttUrl);

// Modelo de MongoDB para las lecturas
const ReadingSchema = new mongoose.Schema({
  unitId: Number,
  sensorType: String,
  value: Number,
  timestamp: Date
});

const Reading = mongoose.model('Reading', ReadingSchema);

// Crear cliente MQTT con opciones de reconexión
const client = mqtt.connect(mqttUrl, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: 8883,
  rejectUnauthorized: false,
  protocol: 'mqtt',
  protocolVersion: 4
});

// Variables para almacenar lecturas
let readingsBuffer = [];
const BUFFER_SIZE = 20;

// Función para procesar el buffer y enviar datos
async function processReadingsBuffer() {
    if (readingsBuffer.length < BUFFER_SIZE) return;

    // Separar lecturas por tipo
    const tempReadings = readingsBuffer.filter(r => r.sensorType === 'temperature');
    const humReadings = readingsBuffer.filter(r => r.sensorType === 'humidity');

    // Calcular máximos y mínimos
    const minTemp = Math.min(...tempReadings.map(r => r.value));
    const maxTemp = Math.max(...tempReadings.map(r => r.value));
    const minHumidity = Math.min(...humReadings.map(r => r.value));
    const maxHumidity = Math.max(...humReadings.map(r => r.value));

    // Crear payload para la API
    const payload = {
        minTemp: minTemp.toString(),
        maxTemp: maxTemp.toString(),
        minHumidity: minHumidity.toString(),
        maxHumidity: maxHumidity.toString()
    };

    try {
        // Enviar datos a la API
        const response = await fetch('https://coldstoragehub.onrender.com/API/storage-unit/2', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Datos enviados a la API:', payload);
        
        // Limpiar el buffer después de procesar
        readingsBuffer = [];
    } catch (error) {
        console.error('Error al enviar datos a la API:', error);
    }
}

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    // Iniciar el servidor Express
    const app = express();

    // Middleware de seguridad
    app.use(helmet());
    app.use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        credentials: true
    }));

    // Configuración de body parsing con límite
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Middleware de logging solo en desarrollo
    app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'development' && req.method === 'POST') {
            console.log('Body recibido:', req.body);
        }
        next();
    });

    // Rate limiting con validación de variables de entorno
    const limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX) || 100
    });
    app.use(limiter);

    // Ruta para obtener lecturas
    app.get('/api/readings', async (req, res) => {
      try {
        const readings = await Reading.find().sort({ timestamp: -1 }).limit(100);
        res.json(readings);
      } catch (error) {
        res.status(500).json({ error: 'Error al obtener lecturas' });
      }
    });

    // Ruta de estado
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        mqtt: client.connected,
        mongodb: mongoose.connection.readyState === 1
      });
    });

    // Rutas API MySQL
    app.use('/api/warehouses', warehouseRoutes);
    app.use('/api/storage-units', storageUnitRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/payments', paymentRoutes);

    // Manejo de errores 404
    app.use((req, res, next) => {
        const error = new Error('Ruta no encontrada');
        error.status = 404;
        next(error);
    });

    // Manejo de errores generales
    app.use((err, req, res, next) => {
        console.error(`[ERROR] ${err.message}`);
        res.status(err.status || 500).json({
            message: err.status === 404 ? err.message : 'Error interno del servidor',
            ...(process.env.NODE_ENV === 'development' && { error: err.stack })
        });
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    console.log('Por favor, asegúrate de que tu IP está whitelisted en MongoDB Atlas');
  });

client.on('connect', () => {
  console.log('Conectado al broker MQTT');
  client.subscribe('warehouse/unit/+/sensor/+', (err) => {
    if (err) {
      console.error('Error al suscribirse:', err);
    } else {
      console.log('Suscrito a tópicos de sensores');
    }
  });
});

client.on('message', async (topic, message) => {
    console.log('Mensaje recibido en tópico:', topic);
    console.log('Contenido del mensaje:', message.toString());
    
    try {
        const data = JSON.parse(message);
        const unitId = topic.split('/')[2];
        const sensorType = topic.split('/')[4];
        
        console.log('Procesando lectura:', {
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        // Guardar en MongoDB
        const reading = new Reading({
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        await reading.save();
        console.log('Lectura guardada en MongoDB:', reading);

        // Agregar al buffer
        readingsBuffer.push({
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        // Procesar buffer si está lleno
        if (readingsBuffer.length >= BUFFER_SIZE) {
            await processReadingsBuffer();
        }
    } catch (error) {
        console.error('Error procesando mensaje:', error);
    }
});