const { Warehouse, User, StorageUnit } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

// Obtener todos los almacenes
exports.getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.findAll();
        res.status(200).json({
            success: true,
            data: warehouses
        });
    } catch (error) {
        console.error('Error al obtener almacenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener almacenes',
            details: error.message
        });
    }
};

// Obtener un almacén por ID
exports.getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Almacén no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: warehouse
        });
    } catch (error) {
        console.error('Error al obtener almacén:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener almacén',
            details: error.message
        });
    }
};

// Crear un nuevo almacén
exports.createWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.create(req.body);
        res.status(201).json({
            success: true,
            data: warehouse
        });
    } catch (error) {
        console.error('Error al crear almacén:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear almacén',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Actualizar un almacén
exports.updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Almacén no encontrado'
            });
        }
        await warehouse.update(req.body);
        res.status(200).json({
            success: true,
            data: warehouse
        });
    } catch (error) {
        console.error('Error al actualizar almacén:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar almacén',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// Eliminar un almacén
exports.deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Almacén no encontrado'
            });
        }
        await warehouse.destroy();
        res.status(200).json({
            success: true,
            message: 'Almacén eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar almacén:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar almacén',
            details: error.message
        });
    }
};

// Buscar almacenes por ubicación
exports.findNearbyWarehouses = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query; // radio en kilómetros

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Se requieren latitud y longitud' });
        }

        const point = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
        
        const warehouses = await Warehouse.findAll({
            where: sequelize.literal(`ST_Distance_Sphere(location, ST_GeomFromText('POINT(${longitude} ${latitude})')) <= ${radius * 1000}`),
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                }
            ]
        });

        // Agregar la distancia a cada almacén
        const warehousesWithDistance = warehouses.map(warehouse => {
            const distance = sequelize.literal(`ST_Distance_Sphere(location, ST_GeomFromText('POINT(${longitude} ${latitude})'))`);
            return {
                ...warehouse.toJSON(),
                distance: parseFloat(distance) / 1000 // convertir a kilómetros
            };
        });

        res.json(warehousesWithDistance);
    } catch (error) {
        console.error('Error al buscar almacenes cercanos:', error);
        res.status(500).json({ 
            error: 'Error al buscar almacenes cercanos',
            details: error.message 
        });
    }
};

// Obtener estadísticas de un almacén
exports.getWarehouseStats = async (req, res) => {
    try {
        const warehouseId = req.params.id;

        const warehouse = await Warehouse.findByPk(warehouseId, {
            include: [
                {
                    model: StorageUnit,
                    as: 'units',
                    attributes: ['status']
                }
            ]
        });

        if (!warehouse) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }

        const stats = {
            totalUnits: warehouse.units.length,
            availableUnits: warehouse.units.filter(unit => unit.status === 'available').length,
            occupiedUnits: warehouse.units.filter(unit => unit.status === 'occupied').length,
            maintenanceUnits: warehouse.units.filter(unit => unit.status === 'maintenance').length,
            reservedUnits: warehouse.units.filter(unit => unit.status === 'reserved').length,
            occupancyRate: warehouse.units.length > 0 
                ? (warehouse.units.filter(unit => unit.status === 'occupied').length / warehouse.units.length) * 100 
                : 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas del almacén:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas del almacén',
            details: error.message 
        });
    }
}; 