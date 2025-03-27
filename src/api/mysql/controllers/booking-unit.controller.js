const { BookingUnit } = require('../models');

// Obtener todas las unidades de reserva
exports.getAllBookingUnits = async (req, res) => {
    try {
        const bookingUnits = await BookingUnit.findAll();
        res.status(200).json({
            success: true,
            data: bookingUnits
        });
    } catch (error) {
        console.error('Error al obtener unidades de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener unidades de reserva',
            details: error.message
        });
    }
};

// Obtener una unidad de reserva por ID
exports.getBookingUnitById = async (req, res) => {
    try {
        const bookingUnit = await BookingUnit.findByPk(req.params.id);
        if (!bookingUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de reserva no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: bookingUnit
        });
    } catch (error) {
        console.error('Error al obtener unidad de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener unidad de reserva',
            details: error.message
        });
    }
};

// Crear una nueva unidad de reserva
exports.createBookingUnit = async (req, res) => {
    try {
        const bookingUnit = await BookingUnit.create(req.body);
        res.status(201).json({
            success: true,
            data: bookingUnit
        });
    } catch (error) {
        console.error('Error al crear unidad de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear unidad de reserva',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Actualizar una unidad de reserva
exports.updateBookingUnit = async (req, res) => {
    try {
        const bookingUnit = await BookingUnit.findByPk(req.params.id);
        if (!bookingUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de reserva no encontrada'
            });
        }
        await bookingUnit.update(req.body);
        res.status(200).json({
            success: true,
            data: bookingUnit
        });
    } catch (error) {
        console.error('Error al actualizar unidad de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar unidad de reserva',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Eliminar una unidad de reserva
exports.deleteBookingUnit = async (req, res) => {
    try {
        const bookingUnit = await BookingUnit.findByPk(req.params.id);
        if (!bookingUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de reserva no encontrada'
            });
        }
        await bookingUnit.destroy();
        res.status(200).json({
            success: true,
            message: 'Unidad de reserva eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar unidad de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar unidad de reserva',
            details: error.message
        });
    }
}; 