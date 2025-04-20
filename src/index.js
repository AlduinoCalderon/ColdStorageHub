// src/index.js (actualizado para integrar MongoDB/MQTT sin romper Express)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectMongoDB } = require('./config/mongodb');
const mqttClient = require('./mqtt');
const { testConnection: testMySQLConnection } = require('./config/mysql');
require('dotenv').config();

// Importar rutas
const mysqlRoutes = require('./api/mysql/routes/index.routes');
const readingsRoutes = require('./api/mongodb/routes/readings.routes');

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Probar conexión MySQL
        await testMySQLConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');

        // Conectar a MongoDB
        const mongooseConnection = await connectMongoDB();

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

        // Rate limiting con validación de variables de entorno
        const limiter = rateLimit({
            windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: Number(process.env.RATE_LIMIT_MAX) || 100
        });
        app.use(limiter);

        // Rutas API MySQL
        app.use('/api', mysqlRoutes);

        // Rutas API MongoDB
        app.use('/api/mongodb', readingsRoutes);

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

        // Iniciar cliente MQTT si está habilitado
        if (process.env.ENABLE_MONGODB_MQTT === 'true') {
            await mqttClient.connect();
        }
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();