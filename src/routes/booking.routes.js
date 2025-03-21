const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware.protect);

// Rutas para todos los usuarios autenticados
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.patch('/:id', bookingController.updateBooking);
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router; 