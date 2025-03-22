const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware.protect);

// Rutas para todos los usuarios autenticados
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBooking);

// Rutas solo para clientes
router.post('/', roleMiddleware.restrictTo('customer', 'admin'), bookingController.createBooking);
router.patch('/:id', bookingController.updateBooking);
router.post('/:id/cancel', bookingController.cancelBooking);

// Rutas solo para propietarios de almacenes y administradores
router.post('/:id/confirm', roleMiddleware.restrictTo('owner', 'admin'), bookingController.confirmBooking);
router.post('/:id/complete', roleMiddleware.restrictTo('owner', 'admin'), bookingController.completeBooking);

module.exports = router;
