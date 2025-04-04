// src/index.js (actualizado para integrar MongoDB/MQTT sin romper Express)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Importar rutas MySQL
const warehouseRoutes = require('./api/mysql/routes/warehouse.routes');
const storageUnitRoutes = require('./api/mysql/routes/storage-unit.routes');
const bookingRoutes = require('./api/mysql/routes/booking.routes');
const userRoutes = require('./api/mysql/routes/user.routes');
const paymentRoutes = require('./api/mysql/routes/payment.routes');

// Importar cliente MQTT
const mqttClient = require('./mqtt');

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI, {
            dbName: 'ColdStorages'
        });
        console.log('Conectado a MongoDB en la base de datos ColdStorages');

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

        // Rutas API MySQL
        app.use('/api/warehouses', warehouseRoutes);
        app.use('/api/storage-units', storageUnitRoutes);
        app.use('/api/bookings', bookingRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/payments', paymentRoutes);

        // Ruta de estado
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                mqtt: mqttClient.connected,
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
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();