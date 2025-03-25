const { Booking, User, StorageUnit, Warehouse } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las reservas con filtros opcionales
exports.getAllBookings = async (req, res) => {
    try {
        const {
            userId,
            status,
            search,
            limit = 10,
            offset = 0,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const filters = {};
        
        if (userId) filters.userId = userId;
        if (status) filters.status = status;
        if (search) {
            filters[Op.or] = [
                { bookingId: { [Op.like]: `%${search}%` } }
            ];
        }

        const bookings = await Booking.findAndCountAll({
            where: filters,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    include: [
                        {
                            model: Warehouse,
                            as: 'warehouse',
                            attributes: ['warehouseId', 'name']
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]]
        });

        res.json({
            total: bookings.count,
            bookings: bookings.rows,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(bookings.count / limit)
        });
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ 
            error: 'Error al obtener reservas',
            details: error.message 
        });
    }
};

// Obtener una reserva por ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    include: [
                        {
                            model: Warehouse,
                            as: 'warehouse',
                            attributes: ['warehouseId', 'name']
                        }
                    ]
                }
            ]
        });
        
        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        res.json(booking);
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({ 
            error: 'Error al obtener reserva',
            details: error.message 
        });
    }
};

// Crear una nueva reserva
exports.createBooking = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { units, ...bookingData } = req.body;

        // Crear la reserva
        const booking = await Booking.create(bookingData, { transaction: t });

        // Asociar las unidades a la reserva
        if (units && units.length > 0) {
            await booking.addUnits(units, { transaction: t });
        }

        await t.commit();

        // Obtener la reserva completa con sus relaciones
        const bookingWithRelations = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    include: [
                        {
                            model: Warehouse,
                            as: 'warehouse',
                            attributes: ['warehouseId', 'name']
                        }
                    ]
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: bookingWithRelations
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al crear reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear reserva',
            details: error.message
        });
    }
};

// Actualizar una reserva
exports.updateBooking = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const { units, ...bookingData } = req.body;
        
        // Actualizar la reserva
        await booking.update(bookingData, { transaction: t });

        // Actualizar las unidades asociadas si se proporcionan
        if (units) {
            await booking.setUnits(units, { transaction: t });
        }
        
        await t.commit();

        // Obtener la reserva actualizada con sus relaciones
        const updatedBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    include: [
                        {
                            model: Warehouse,
                            as: 'warehouse',
                            attributes: ['warehouseId', 'name']
                        }
                    ]
                }
            ]
        });

        res.json(updatedBooking);
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ 
            error: 'Error al actualizar reserva',
            details: error.message 
        });
    }
};

// Eliminar una reserva (soft delete)
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        await booking.destroy(); // Soft delete debido a paranoid: true
        res.json({ message: 'Reserva eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({ 
            error: 'Error al eliminar reserva',
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