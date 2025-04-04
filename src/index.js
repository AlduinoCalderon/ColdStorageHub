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

// Modelo de MongoDB para las lecturas
const ReadingSchema = new mongoose.Schema({
  unitId: Number,
  sensorType: String,
  value: Number,
  timestamp: Date
});

const Reading = mongoose.model('Reading', ReadingSchema);

// Crear cliente MQTT con opciones de reconexión
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: 8883,
  rejectUnauthorized: false
});

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
        mqtt: mqttClient.connected,
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

// Conectar al broker MQTT
const mqttUrl = MQTT_BROKER_URL.startsWith('mqtt://') ? MQTT_BROKER_URL : `mqtt://${MQTT_BROKER_URL}`;
console.log('Conectando a MQTT:', mqttUrl);

const client = mqtt.connect(mqttUrl, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: 8883,
  rejectUnauthorized: false
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

    const reading = new Reading({
      unitId,
      sensorType,
      value: data.value,
      timestamp: data.timestamp
    });

    await reading.save();
    console.log('Lectura guardada en MongoDB:', reading);
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
});