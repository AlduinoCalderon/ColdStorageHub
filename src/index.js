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

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://coldstoragehub:1234@coldstoragehub.0j8jq.mongodb.net/ColdStorages?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB - Base de datos: ColdStorages'))
.catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    console.log('⚠️  Asegúrate de que tu IP está whitelisted en MongoDB Atlas');
});

// Definir el esquema de Reading
const readingSchema = new mongoose.Schema({
    unitId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
}, { collection: 'Readings' });

const Reading = mongoose.model('Reading', readingSchema);

// Crear cliente MQTT con opciones de reconexión
const client = mqtt.connect(mqttUrl, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: 8883,
  rejectUnauthorized: false,
  protocol: 'mqtts',
  protocolVersion: 4,
  clientId: `warehouse_iot_${Math.random().toString(16).slice(2, 8)}`,
  reconnectPeriod: 5000,
  clean: true,
  keepalive: 60
});

// Variables para almacenar lecturas
let readingsBuffer = [];
const BUFFER_SIZE = 20;

// Función para procesar el buffer y enviar datos
async function processReadingsBuffer() {
    if (readingsBuffer.length < BUFFER_SIZE) return;

    console.log('🔄 Procesando buffer de lecturas...');
    console.log(`📊 Total de lecturas en buffer: ${readingsBuffer.length}`);

    // Separar lecturas por tipo
    const tempReadings = readingsBuffer.filter(r => r.sensorType === 'temperature');
    const humReadings = readingsBuffer.filter(r => r.sensorType === 'humidity');

    console.log(`🌡️  Lecturas de temperatura: ${tempReadings.length}`);
    console.log(`💧 Lecturas de humedad: ${humReadings.length}`);

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

    console.log('📤 Enviando datos a la API:', payload);

    try {
        // Enviar datos a la API
        const response = await fetch('https://coldstoragehub.onrender.com/API/storage-units/1', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('✅ Datos enviados exitosamente a la API:', responseData);
        
        // Limpiar el buffer después de procesar
        readingsBuffer = [];
        console.log('🧹 Buffer limpiado');
    } catch (error) {
        console.error('❌ Error al enviar datos a la API:', error);
        // No limpiamos el buffer si hay error para reintentar
    }
}

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Probar conexión MySQL
        await testMySQLConnection();
        console.log('Conexión a MySQL establecida correctamente');

        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Iniciar el servidor Express
        const app = express();

        // Middleware de seguridad
        app.use(helmet());
        app.use(cors({
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
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

        // Rate  limiting con validación de variables de entorno
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
                mongodb: mongoose.connection.readyState === 1,
                mysql: sequelize.authenticate()
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
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();

// Eventos MQTT
client.on('connect', () => {
    console.log('🔌 Conectado al broker MQTT');
    client.subscribe('warehouse/unit/+/sensor/+', (err) => {
        if (err) {
            console.error('❌ Error al suscribirse:', err);
        } else {
            console.log('✅ Suscrito a tópicos de sensores');
        }
    });
});

client.on('error', (error) => {
    console.error('❌ Error de cliente MQTT:', error);
    console.log('Detalles del error:', error.message);
});

client.on('reconnect', () => {
    console.log('🔄 Reconectando al broker MQTT...');
});

client.on('offline', () => {
    console.log('📴 Cliente MQTT desconectado');
});

client.on('close', () => {
    console.log('🔒 Conexión MQTT cerrada');
});

client.on('message', async (topic, message) => {
    console.log('📥 Mensaje recibido en tópico:', topic);
    console.log('📦 Contenido del mensaje:', message.toString());
    
    try {
        const data = JSON.parse(message);
        const unitId = topic.split('/')[2];
        const sensorType = topic.split('/')[4];
        
        console.log('🔍 Procesando lectura:', {
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
            timestamp: new Date(data.timestamp)
        });

        await reading.save();
        console.log('💾 Lectura guardada en MongoDB:', reading);

        // Agregar al buffer
        readingsBuffer.push({
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        console.log(`📊 Buffer actual: ${readingsBuffer.length}/${BUFFER_SIZE} lecturas`);

        // Procesar buffer si está lleno
        if (readingsBuffer.length >= BUFFER_SIZE) {
            await processReadingsBuffer();
        }
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
    }
});