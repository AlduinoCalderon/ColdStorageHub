const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const warehouseRoutes = require('./warehouse.routes');
const storageUnitRoutes = require('./storage-unit.routes');
const bookingRoutes = require('./booking.routes');
const sensorRoutes = require('./sensor.routes');

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de almacenes
router.use('/warehouses', warehouseRoutes);

// Rutas de unidades de almacenamiento
router.use('/storage-units', storageUnitRoutes);

// Rutas de reservas
router.use('/bookings', bookingRoutes);

// Rutas de sensores
router.use('/sensors', sensorRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'API funcionando correctamente'
    });
});

module.exports = router; 