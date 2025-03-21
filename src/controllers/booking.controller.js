const Booking = require('../models/booking.model');
const StorageUnit = require('../models/storage-unit.model');
const Warehouse = require('../models/warehouse.model');
const { Op } = require('sequelize');

// Crear una nueva reserva
exports.createBooking = async (req, res) => {
    try {
        const { storage_unit_id, start_time, end_time, cargo_details } = req.body;

        // Verificar si la unidad de almacenamiento existe y está disponible
        const storageUnit = await StorageUnit.findByPk(storage_unit_id, {
            include: [{
                model: Warehouse,
                as: 'warehouse'
            }]
        });

        if (!storageUnit) {
            return res.status(404).json({
                status: 'error',
                message: 'Unidad de almacenamiento no encontrada'
            });
        }

        if (storageUnit.status !== 'available') {
            return res.status(400).json({
                status: 'error',
                message: 'La unidad de almacenamiento no está disponible'
            });
        }

        // Verificar si hay conflictos de horario
        const existingBooking = await Booking.findOne({
            where: {
                storage_unit_id,
                status: {
                    [Op.in]: ['pending', 'active']
                },
                [Op.or]: [
                    {
                        start_time: {
                            [Op.between]: [start_time, end_time]
                        }
                    },
                    {
                        end_time: {
                            [Op.between]: [start_time, end_time]
                        }
                    }
                ]
            }
        });

        if (existingBooking) {
            return res.status(400).json({
                status: 'error',
                message: 'Ya existe una reserva para este período'
            });
        }

        // Calcular el costo total
        const duration = new Date(end_time) - new Date(start_time);
        const hours = duration / (1000 * 60 * 60);
        const total_cost = hours * storageUnit.cost_per_hour;

        const booking = await Booking.create({
            user_id: req.user.id,
            storage_unit_id,
            start_time,
            end_time,
            cargo_details,
            total_cost,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todas las reservas
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [{
                model: StorageUnit,
                as: 'storage_unit',
                include: [{
                    model: Warehouse,
                    as: 'warehouse'
                }]
            }]
        });

        res.json({
            status: 'success',
            results: bookings.length,
            data: { bookings }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las reservas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una reserva específica
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit',
                include: [{
                    model: Warehouse,
                    as: 'warehouse'
                }]
            }]
        });

        if (!booking) {
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        res.json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar una reserva
exports.updateBooking = async (req, res) => {
    try {
        const { start_time, end_time, cargo_details, status } = req.body;
        
        const booking = await Booking.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit'
            }]
        });
        
        if (!booking) {
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar si el usuario es el propietario o el dueño del almacén
        if (booking.user_id !== req.user.id && 
            booking.storage_unit.warehouse.owner_id !== req.user.id && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para actualizar esta reserva'
            });
        }

        // Si se actualiza el horario, verificar conflictos
        if (start_time || end_time) {
            const newStartTime = start_time || booking.start_time;
            const newEndTime = end_time || booking.end_time;

            const existingBooking = await Booking.findOne({
                where: {
                    storage_unit_id: booking.storage_unit_id,
                    id: { [Op.ne]: booking.id },
                    status: {
                        [Op.in]: ['pending', 'active']
                    },
                    [Op.or]: [
                        {
                            start_time: {
                                [Op.between]: [newStartTime, newEndTime]
                            }
                        },
                        {
                            end_time: {
                                [Op.between]: [newStartTime, newEndTime]
                            }
                        }
                    ]
                }
            });

            if (existingBooking) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Ya existe una reserva para este período'
                });
            }
        }

        // Actualizar campos
        if (start_time) booking.start_time = start_time;
        if (end_time) booking.end_time = end_time;
        if (cargo_details) booking.cargo_details = cargo_details;
        if (status) booking.status = status;

        await booking.save();

        res.json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cancelar una reserva
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit'
            }]
        });
        
        if (!booking) {
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar si el usuario es el propietario o el dueño del almacén
        if (booking.user_id !== req.user.id && 
            booking.storage_unit.warehouse.owner_id !== req.user.id && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para cancelar esta reserva'
            });
        }

        // Solo se pueden cancelar reservas pendientes o activas
        if (!['pending', 'active'].includes(booking.status)) {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede cancelar una reserva en este estado'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al cancelar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 