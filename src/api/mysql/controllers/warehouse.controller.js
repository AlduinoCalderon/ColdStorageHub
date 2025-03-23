const { Warehouse, User, StorageUnit } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// Obtener todos los almacenes con filtros opcionales
exports.getAllWarehouses = async (req, res) => {
    try {
        const {
            status,
            ownerId,
            search,
            limit = 10,
            offset = 0,
            sort = 'createdAt',
            order = 'DESC'
        } = req.query;

        const filters = {};
        
        if (status) filters.status = status;
        if (ownerId) filters.ownerId = ownerId;
        if (search) {
            filters[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } }
            ];
        }

        const warehouses = await Warehouse.findAndCountAll({
            where: filters,
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    attributes: ['unitId', 'name', 'status', 'costPerHour']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]],
            distinct: true
        });

        res.json({
            total: warehouses.count,
            warehouses: warehouses.rows,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(warehouses.count / limit)
        });
    } catch (error) {
        console.error('Error al obtener almacenes:', error);
        res.status(500).json({ 
            error: 'Error al obtener almacenes',
            details: error.message 
        });
    }
};

// Obtener un almacén por ID
exports.getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    attributes: ['unitId', 'name', 'status', 'costPerHour']
                }
            ]
        });
        
        if (!warehouse) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        
        res.json(warehouse);
    } catch (error) {
        console.error('Error al obtener almacén:', error);
        res.status(500).json({ 
            error: 'Error al obtener almacén',
            details: error.message 
        });
    }
};

// Crear un nuevo almacén
exports.createWarehouse = async (req, res) => {
    try {
        // Validar que el usuario existe
        const owner = await User.findByPk(req.body.ownerId);
        if (!owner) {
            return res.status(404).json({ error: 'Propietario no encontrado' });
        }

        // Validar que el rol del usuario sea 'owner'
        if (owner.role !== 'owner') {
            return res.status(403).json({ error: 'El usuario debe tener rol de propietario' });
        }

        const warehouse = await Warehouse.create(req.body);
        
        // Obtener el almacén creado con sus relaciones
        const warehouseWithRelations = await Warehouse.findByPk(warehouse.warehouseId, {
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                }
            ]
        });

        res.status(201).json(warehouseWithRelations);
    } catch (error) {
        console.error('Error al crear almacén:', error);
        res.status(500).json({ 
            error: 'Error al crear almacén',
            details: error.message 
        });
    }
};

// Actualizar un almacén
exports.updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }

        // Si se está actualizando el propietario, validar que existe y tiene el rol correcto
        if (req.body.ownerId) {
            const newOwner = await User.findByPk(req.body.ownerId);
            if (!newOwner) {
                return res.status(404).json({ error: 'Nuevo propietario no encontrado' });
            }
            if (newOwner.role !== 'owner') {
                return res.status(403).json({ error: 'El nuevo usuario debe tener rol de propietario' });
            }
        }
        
        await warehouse.update(req.body);

        // Obtener el almacén actualizado con sus relaciones
        const updatedWarehouse = await Warehouse.findByPk(warehouse.warehouseId, {
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: StorageUnit,
                    as: 'units',
                    attributes: ['unitId', 'name', 'status', 'costPerHour']
                }
            ]
        });

        res.json(updatedWarehouse);
    } catch (error) {
        console.error('Error al actualizar almacén:', error);
        res.status(500).json({ 
            error: 'Error al actualizar almacén',
            details: error.message 
        });
    }
};

// Eliminar un almacén (soft delete)
exports.deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        
        await warehouse.destroy(); // Soft delete debido a paranoid: true
        res.json({ message: 'Almacén eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar almacén:', error);
        res.status(500).json({ 
            error: 'Error al eliminar almacén',
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

        const warehouses = await Warehouse.findAll({
            where: sequelize.where(
                sequelize.fn(
                    'ST_Distance_Sphere',
                    sequelize.col('location'),
                    sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`)
                ),
                {
                    [Op.lte]: radius * 1000 // convertir a metros
                }
            ),
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['userId', 'name', 'email']
                }
            ]
        });

        res.json(warehouses);
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