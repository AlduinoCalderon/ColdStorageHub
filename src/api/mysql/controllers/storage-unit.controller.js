const { StorageUnit, Warehouse } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las unidades de almacenamiento con filtros opcionales
exports.getAllStorageUnits = async (req, res) => {
    try {
        const {
            warehouseId,
            status,
            search,
            limit = 10,
            offset = 0,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const filters = {};
        
        if (warehouseId) filters.warehouseId = warehouseId;
        if (status) filters.status = status;
        if (search) {
            filters[Op.or] = [
                { name: { [Op.like]: `%${search}%` } }
            ];
        }

        const units = await StorageUnit.findAndCountAll({
            where: filters,
            include: [
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'status']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]]
        });

        res.json({
            total: units.count,
            units: units.rows,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(units.count / limit)
        });
    } catch (error) {
        console.error('Error al obtener unidades de almacenamiento:', error);
        res.status(500).json({ 
            error: 'Error al obtener unidades de almacenamiento',
            details: error.message 
        });
    }
};

// Obtener una unidad de almacenamiento por ID
exports.getStorageUnitById = async (req, res) => {
    try {
        const unit = await StorageUnit.findByPk(req.params.id, {
            include: [
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'status']
                }
            ]
        });
        
        if (!unit) {
            return res.status(404).json({ error: 'Unidad de almacenamiento no encontrada' });
        }
        
        res.json(unit);
    } catch (error) {
        console.error('Error al obtener unidad de almacenamiento:', error);
        res.status(500).json({ 
            error: 'Error al obtener unidad de almacenamiento',
            details: error.message 
        });
    }
};

// Crear una nueva unidad de almacenamiento
exports.createStorageUnit = async (req, res) => {
    try {
        const unit = await StorageUnit.create(req.body);
        
        // Obtener la unidad con su almacén asociado
        const unitWithWarehouse = await StorageUnit.findByPk(unit.unitId, {
            include: [
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'status']
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: unitWithWarehouse
        });
    } catch (error) {
        console.error('Error al crear unidad de almacenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear unidad de almacenamiento',
            details: error.message
        });
    }
};

// Actualizar una unidad de almacenamiento
exports.updateStorageUnit = async (req, res) => {
    try {
        const unit = await StorageUnit.findByPk(req.params.id);
        
        if (!unit) {
            return res.status(404).json({ error: 'Unidad de almacenamiento no encontrada' });
        }
        
        await unit.update(req.body);

        // Obtener la unidad actualizada con su almacén asociado
        const updatedUnit = await StorageUnit.findByPk(unit.unitId, {
            include: [
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'status']
                }
            ]
        });

        res.json(updatedUnit);
    } catch (error) {
        console.error('Error al actualizar unidad de almacenamiento:', error);
        res.status(500).json({ 
            error: 'Error al actualizar unidad de almacenamiento',
            details: error.message 
        });
    }
};

// Eliminar una unidad de almacenamiento (soft delete)
exports.deleteStorageUnit = async (req, res) => {
    try {
        const unit = await StorageUnit.findByPk(req.params.id);
        
        if (!unit) {
            return res.status(404).json({ error: 'Unidad de almacenamiento no encontrada' });
        }
        
        await unit.destroy(); // Soft delete debido a paranoid: true
        res.json({ message: 'Unidad de almacenamiento eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar unidad de almacenamiento:', error);
        res.status(500).json({ 
            error: 'Error al eliminar unidad de almacenamiento',
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