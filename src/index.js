const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuraciones de bases de datos
const { sequelize, testConnection: testMySQLConnection } = require('./config/mysql');
const { connectDB: connectMongoDB } = require('./config/mongodb');

const app = express();

// Middleware básico
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting básico
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100
});
app.use(limiter);

// Rutas básicas de la API
app.use('/api/mysql/warehouses', require('./api/mysql/routes/warehouse.routes'));
app.use('/api/mysql/units', require('./api/mysql/routes/unit.routes'));
app.use('/api/mysql/bookings', require('./api/mysql/routes/booking.routes'));
app.use('/api/mongodb/sensors', require('./api/mongodb/routes/sensor.routes'));
app.use('/api/mongodb/readings', require('./api/mongodb/routes/reading.routes'));

// Manejo básico de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Iniciar servidor y conexiones a bases de datos
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Probar conexión a MySQL
        await testMySQLConnection();
        
        // Conectar a MongoDB
        await connectMongoDB();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 