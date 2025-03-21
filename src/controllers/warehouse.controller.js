const Warehouse = require('../models/warehouse.model');
const StorageUnit = require('../models/storage-unit.model');
const { Op } = require('sequelize');

// Crear un nuevo almacén
exports.createWarehouse = async (req, res) => {
    try {
        const { address, location, operating_hours, amenities } = req.body;
        
        // Crear el punto de ubicación
        const point = {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
        };

        const warehouse = await Warehouse.create({
            owner_id: req.user.id,
            address,
            location: point,
            operating_hours,
            amenities
        });

        res.status(201).json({
            status: 'success',
            data: { warehouse }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear el almacén',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los almacenes
exports.getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.findAll({
            include: [{
                model: StorageUnit,
                as: 'storage_units',
                attributes: ['id', 'capacity_m3', 'cost_per_hour']
            }]
        });

        res.json({
            status: 'success',
            results: warehouses.length,
            data: { warehouses }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los almacenes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un almacén específico
exports.getWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_units'
            }]
        });

        if (!warehouse) {
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        res.json({
            status: 'success',
            data: { warehouse }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el almacén',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar un almacén
exports.updateWarehouse = async (req, res) => {
    try {
        const { address, location, operating_hours, amenities, status } = req.body;
        
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        // Verificar si el usuario es el propietario
        if (warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para actualizar este almacén'
            });
        }

        // Actualizar campos
        if (location) {
            warehouse.location = {
                type: 'Point',
                coordinates: [location.longitude, location.latitude]
            };
        }
        if (address) warehouse.address = address;
        if (operating_hours) warehouse.operating_hours = operating_hours;
        if (amenities) warehouse.amenities = amenities;
        if (status) warehouse.status = status;

        await warehouse.save();

        res.json({
            status: 'success',
            data: { warehouse }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el almacén',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar un almacén (borrado lógico)
exports.deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        // Verificar si el usuario es el propietario
        if (warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para eliminar este almacén'
            });
        }

        await warehouse.destroy();

        res.json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el almacén',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Buscar almacenes cercanos
exports.findNearbyWarehouses = async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 50, requiredCapacity } = req.query;
        
        const warehouses = await Warehouse.findAll({
            where: {
                status: 'active',
                deleted_at: null,
                [Op.and]: [
                    sequelize.literal(`ST_Distance_Sphere(location, POINT(${longitude}, ${latitude})) <= ${maxDistance * 1000}`)
                ]
            },
            include: [{
                model: StorageUnit,
                as: 'storage_units',
                where: requiredCapacity ? {
                    capacity_m3: {
                        [Op.gte]: requiredCapacity
                    }
                } : undefined,
                required: !!requiredCapacity
            }]
        });

        res.json({
            status: 'success',
            results: warehouses.length,
            data: { warehouses }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al buscar almacenes cercanos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 