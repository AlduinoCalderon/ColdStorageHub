const { StorageUnit, Warehouse } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las unidades de almacenamiento
exports.getAllStorageUnits = async (req, res) => {
    try {
        const storageUnits = await StorageUnit.findAll();
        res.status(200).json({
            success: true,
            data: storageUnits
        });
    } catch (error) {
        console.error('Error al obtener unidades de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener unidades de almacenamiento',
            details: error.message
        });
    }
};

// Obtener una unidad de almacenamiento por ID
exports.getStorageUnitById = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.findByPk(req.params.id);
        if (!storageUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de almacenamiento no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: storageUnit
        });
    } catch (error) {
        console.error('Error al obtener unidad de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener unidad de almacenamiento',
            details: error.message
        });
    }
};

// Crear una nueva unidad de almacenamiento
exports.createStorageUnit = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.create(req.body);
        res.status(201).json({
            success: true,
            data: storageUnit
        });
    } catch (error) {
        console.error('Error al crear unidad de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear unidad de almacenamiento',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Actualizar una unidad de almacenamiento
exports.updateStorageUnit = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.findByPk(req.params.id);
        if (!storageUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de almacenamiento no encontrada'
            });
        }
        await storageUnit.update(req.body);
        res.status(200).json({
            success: true,
            data: storageUnit
        });
    } catch (error) {
        console.error('Error al actualizar unidad de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar unidad de almacenamiento',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Eliminar una unidad de almacenamiento
exports.deleteStorageUnit = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.findByPk(req.params.id);
        if (!storageUnit) {
            return res.status(404).json({
                success: false,
                message: 'Unidad de almacenamiento no encontrada'
            });
        }
        await storageUnit.destroy();
        res.status(200).json({
            success: true,
            message: 'Unidad de almacenamiento eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar unidad de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar unidad de almacenamiento',
            details: error.message
        });
    }
};

// Obtener estadísticas de unidades por almacén
exports.getStorageUnitStats = async (req, res) => {
    try {
        const warehouseId = req.params.warehouseId;

        const stats = await StorageUnit.findAll({
            where: { warehouseId },
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('unitId')), 'count']
            ],
            group: ['status']
        });

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas de unidades:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas de unidades',
            details: error.message 
        });
    }
};