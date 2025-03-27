const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuraciones de bases de datos
const { sequelize, testConnection: testMySQLConnection } = require('./config/mysql');
// const { connectDB: connectMongoDB } = require('./config/mongodb');

// Importar rutas
const warehouseRoutes = require('./api/mysql/routes/warehouse.routes');
const storageUnitRoutes = require('./api/mysql/routes/storage-unit.routes');
const bookingRoutes = require('./api/mysql/routes/booking.routes');
const userRoutes = require('./api/mysql/routes/user.routes');
const paymentRoutes = require('./api/mysql/routes/payment.routes');

const app = express();

// Middleware básico
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));

// Configuración de express.json con logging
app.use(express.json());
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Body recibido:', req.body);
    }
    next();
});

app.use(express.urlencoded({ extended: true }));

// Rate limiting básico
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100
});
app.use(limiter);

// Ruta de estado
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Rutas API MySQL
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/storage-units', storageUnitRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor y conexiones a bases de datos
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Probar conexión a MySQL
        await testMySQLConnection();
        console.log('MySQL connection successful');
        
        // Sincronizar modelos con la base de datos
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('Database synchronized');
        
        // Conectar a MongoDB (comentado hasta que se configure)
        // await connectMongoDB();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 