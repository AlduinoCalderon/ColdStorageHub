const StorageUnit = require('../models/storage-unit.model');
const Warehouse = require('../models/warehouse.model');

// Crear una nueva unidad de almacenamiento
exports.createStorageUnit = async (req, res) => {
    try {
        const { warehouse_id, capacity_m3, cost_per_hour, temperature_range, humidity_range } = req.body;

        // Verificar si el almacén existe y pertenece al usuario
        const warehouse = await Warehouse.findByPk(warehouse_id);
        if (!warehouse) {
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        if (warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para agregar unidades a este almacén'
            });
        }

        const storageUnit = await StorageUnit.create({
            warehouse_id,
            capacity_m3,
            cost_per_hour,
            temperature_range,
            humidity_range
        });

        res.status(201).json({
            status: 'success',
            data: { storageUnit }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la unidad de almacenamiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todas las unidades de almacenamiento
exports.getAllStorageUnits = async (req, res) => {
    try {
        const storageUnits = await StorageUnit.findAll({
            include: [{
                model: Warehouse,
                as: 'warehouse',
                attributes: ['id', 'address', 'status']
            }]
        });

        res.json({
            status: 'success',
            results: storageUnits.length,
            data: { storageUnits }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las unidades de almacenamiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una unidad de almacenamiento específica
exports.getStorageUnit = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.findByPk(req.params.id, {
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

        res.json({
            status: 'success',
            data: { storageUnit }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la unidad de almacenamiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar una unidad de almacenamiento
exports.updateStorageUnit = async (req, res) => {
    try {
        const { capacity_m3, cost_per_hour, temperature_range, humidity_range, status } = req.body;
        
        const storageUnit = await StorageUnit.findByPk(req.params.id, {
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

        // Verificar si el usuario es el propietario del almacén
        if (storageUnit.warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para actualizar esta unidad'
            });
        }

        // Actualizar campos
        if (capacity_m3) storageUnit.capacity_m3 = capacity_m3;
        if (cost_per_hour) storageUnit.cost_per_hour = cost_per_hour;
        if (temperature_range) storageUnit.temperature_range = temperature_range;
        if (humidity_range) storageUnit.humidity_range = humidity_range;
        if (status) storageUnit.status = status;

        await storageUnit.save();

        res.json({
            status: 'success',
            data: { storageUnit }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar la unidad de almacenamiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar una unidad de almacenamiento (borrado lógico)
exports.deleteStorageUnit = async (req, res) => {
    try {
        const storageUnit = await StorageUnit.findByPk(req.params.id, {
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

        // Verificar si el usuario es el propietario del almacén
        if (storageUnit.warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para eliminar esta unidad'
            });
        }

        await storageUnit.destroy();

        res.json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar la unidad de almacenamiento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 