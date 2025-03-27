const { Payment, Booking, User } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los pagos
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos',
            details: error.message
        });
    }
};

// Obtener un pago por ID
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pago',
            details: error.message
        });
    }
};

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error al crear pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pago',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Actualizar un pago
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        await payment.update(req.body);
        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar pago',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Eliminar un pago
exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        await payment.destroy();
        res.status(200).json({
            success: true,
            message: 'Pago eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pago',
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