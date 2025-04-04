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

// Modelo de MongoDB para las lecturas
const ReadingSchema = new mongoose.Schema({
  unitId: Number,
  sensorType: String,
  value: Number,
  timestamp: Date
});

const Reading = mongoose.model('Reading', ReadingSchema);

// Crear cliente MQTT
const mqttClient = mqtt.connect(mqttUrl, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD
});

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    console.log('Por favor, asegúrate de que tu IP está en la lista blanca de MongoDB Atlas');
  });

// Configuración MQTT
mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  mqttClient.subscribe('warehouse/unit/+/sensor/+');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    const unitId = parseInt(topicParts[2]);
    const sensorType = topicParts[4];

    // Crear nueva lectura en MongoDB
    const reading = new Reading({
      unitId,
      sensorType,
      value: payload.value,
      timestamp: new Date(payload.timestamp)
    });

    await reading.save();
    console.log(`Lectura guardada: ${sensorType} = ${payload.value}`);
  } catch (error) {
    console.error('Error procesando mensaje MQTT:', error);
  }
});

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

const startServer = async () => {
    try {
        // Probar conexión MySQL
        await testMySQLConnection();
        console.log('Conexión a MySQL establecida correctamente');

        // Configurar rutas
        app.use('/api/warehouses', warehouseRoutes);
        app.use('/api/storage-units', storageUnitRoutes);
        app.use('/api/bookings', bookingRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/payments', paymentRoutes);

        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();