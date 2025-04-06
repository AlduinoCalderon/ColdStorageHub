// src/index.js (actualizado para integrar MongoDB/MQTT sin romper Express)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Importar rutas
const warehouseRoutes = require('./api/mysql/routes/warehouse.routes');
const storageUnitRoutes = require('./api/mysql/routes/storage-unit.routes');
const bookingRoutes = require('./api/mysql/routes/booking.routes');
const userRoutes = require('./api/mysql/routes/user.routes');
const paymentRoutes = require('./api/mysql/routes/payment.routes');

// Importar cliente MQTT
const mqttClient = require('./mqtt');

// Configuración de MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://coldstoragehub:1234@coldstoragehub.0j8jq.mongodb.net/ColdStorages?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB - Base de datos: ColdStorages'))
.catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    console.log('⚠️  Asegúrate de que tu IP está whitelisted en MongoDB Atlas');
});

// Iniciar cliente MQTT
if (process.env.ENABLE_MONGODB_MQTT === 'true') {
    mqttClient.connect();
}

// Crear aplicación Express
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

// Rate limiting con validación de variables de entorno
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100
});
app.use(limiter);

// Rutas API MySQL
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/storage-units', storageUnitRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Ruta para obtener lecturas
app.get('/api/readings', async (req, res) => {
    try {
        const Reading = require('./api/mongodb/models/reading.model');
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
        mqtt: mqttClient.client ? mqttClient.client.connected : false,
        mongodb: mongoose.connection.readyState === 1
    });
});

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