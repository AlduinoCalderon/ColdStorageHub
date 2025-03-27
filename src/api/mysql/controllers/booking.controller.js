const { Booking, User, StorageUnit, Warehouse } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las reservas
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll();
        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservas',
            details: error.message
        });
    }
};

// Obtener una reserva por ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reserva',
            details: error.message
        });
    }
};

// Crear una nueva reserva
exports.createBooking = async (req, res) => {
    try {
        const booking = await Booking.create(req.body);
        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear reserva',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Actualizar una reserva
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }
        await booking.update(req.body);
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reserva',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Eliminar una reserva
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }
        await booking.destroy();
        res.status(200).json({
            success: true,
            message: 'Reserva eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar reserva',
            details: error.message
        });
    }
};

// Obtener estadísticas de reservas
exports.getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('bookingId')), 'count']
            ],
            group: ['status']
        });

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas de reservas:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas de reservas',
            details: error.message 
        });
    }
};