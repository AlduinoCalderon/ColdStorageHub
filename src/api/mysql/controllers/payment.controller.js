const { Payment, Booking, User } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los pagos con filtros opcionales
exports.getAllPayments = async (req, res) => {
    try {
        const {
            userId,
            bookingId,
            status,
            search,
            limit = 10,
            offset = 0,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const filters = {};
        
        if (userId) filters.userId = userId;
        if (bookingId) filters.bookingId = bookingId;
        if (status) filters.status = status;
        if (search) {
            filters[Op.or] = [
                { paymentId: { [Op.like]: `%${search}%` } }
            ];
        }

        const payments = await Payment.findAndCountAll({
            where: filters,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['bookingId', 'status', 'startDate', 'endDate']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]]
        });

        res.json({
            total: payments.count,
            payments: payments.rows,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(payments.count / limit)
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ 
            error: 'Error al obtener pagos',
            details: error.message 
        });
    }
};

// Obtener un pago por ID
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['bookingId', 'status', 'startDate', 'endDate']
                }
            ]
        });
        
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        
        res.json(payment);
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({ 
            error: 'Error al obtener pago',
            details: error.message 
        });
    }
};

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        
        // Obtener el pago con sus relaciones
        const paymentWithRelations = await Payment.findByPk(payment.paymentId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['bookingId', 'status', 'startDate', 'endDate']
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: paymentWithRelations
        });
    } catch (error) {
        console.error('Error al crear pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pago',
            details: error.message
        });
    }
};

// Actualizar un pago
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        
        await payment.update(req.body);

        // Obtener el pago actualizado con sus relaciones
        const updatedPayment = await Payment.findByPk(payment.paymentId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['bookingId', 'status', 'startDate', 'endDate']
                }
            ]
        });

        res.json(updatedPayment);
    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json({ 
            error: 'Error al actualizar pago',
            details: error.message 
        });
    }
};

// Eliminar un pago (soft delete)
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        
        await payment.destroy(); // Soft delete debido a paranoid: true
        res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        res.status(500).json({ 
            error: 'Error al eliminar pago',
            details: error.message 
        });
    }
};

// Obtener estadísticas de pagos
exports.getPaymentStats = async (req, res) => {
    try {
        const stats = await Payment.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('paymentId')), 'count'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
            ],
            group: ['status']
        });

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas de pagos:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas de pagos',
            details: error.message 
        });
    }
};