// src/index.js (actualizado para integrar MongoDB/MQTT sin romper Express)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// MySQL config
const { sequelize, testConnection: testMySQLConnection } = require('./config/mysql');
const warehouseRoutes = require('./api/mysql/routes/warehouse.routes');
const storageUnitRoutes = require('./api/mysql/routes/storage-unit.routes');
const bookingRoutes = require('./api/mysql/routes/booking.routes');
const userRoutes = require('./api/mysql/routes/user.routes');
const paymentRoutes = require('./api/mysql/routes/payment.routes');

// MongoDB & MQTT config (nuevo)
const { connectMongoDB } = require('./config/mongodb');
const { setupReadingListener } = require('./api/mongodb/triggers/batch-processor');

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

// Ruta de estado
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        services: {
            mysql: true,
            mongodb: global.mongodbConnected || false,
            mqtt: global.mqttConnected || false
        }
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

const PORT = process.env.PORT || 3000;

// Función para iniciar el servicio MongoDB/MQTT (solo si está habilitado)
async function startMongodbMqtt() {
    if (process.env.ENABLE_MONGODB_MQTT === 'true') {
        try {
            // Conectar a MongoDB
            await connectMongoDB();
            global.mongodbConnected = true;
            console.log('✅ MongoDB connection successful');
            
            // Configurar MQTT y triggers
            const mqttClient = require('./mqtt');
            global.mqttClient = mqttClient;
            global.mqttConnected = true;
            
            // Configurar listener para procesamiento por lotes
            await setupReadingListener();
            console.log('✅ IoT monitoring services started');
        } catch (error) {
            console.error('❌ Failed to start MongoDB/MQTT services:', error);
            global.mongodbConnected = false;
            global.mqttConnected = false;
        }
    } else {
        console.log('ℹ️ MongoDB/MQTT services disabled by configuration');
    }
}

// Función principal para iniciar el servidor
const startServer = async () => {
    try {
        // Iniciar MySQL (siempre requerido)
        await testMySQLConnection();
        console.log('✅ MySQL connection successful');

        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Database synchronized');

        // Iniciar MongoDB/MQTT (opcional según configuración)
        await startMongodbMqtt();

        // Iniciar servidor Express
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        setTimeout(() => process.exit(1), 5000); // Espera 5 segundos antes de salir
    }
};

// Flag para capturar SIGINT y cerrar conexiones correctamente
process.on('SIGINT', async () => {
    console.log('Cerrando conexiones...');
    
    // Cerrar MySQL
    await sequelize.close();
    console.log('MySQL connection closed');
    
    // Cerrar MongoDB/MQTT si están activos
    if (global.mqttClient) {
        global.mqttClient.end();
        console.log('MQTT connection closed');
    }
    
    console.log('Goodbye!');
    process.exit(0);
});

startServer();