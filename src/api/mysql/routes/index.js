const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const storageUnitRoutes = require('./storage-unit.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const warehouseRoutes = require('./warehouse.routes');

// Registrar todas las rutas
router.use('/users', userRoutes);
router.use('/storage-units', storageUnitRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/warehouses', warehouseRoutes);

module.exports = router;