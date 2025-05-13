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

// Función para calcular la distancia usando la fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Number(distance.toFixed(2)); // Redondear a 2 decimales
}

// Función para calcular el costo por hora basado en el tamaño y tipo
function calculateCostPerHour(size, type) {
    const baseCost = {
        'small': 50,
        'medium': 100,
        'large': 200
    };
    
    const typeMultiplier = {
        'standard': 1,
        'refrigerated': 1.5,
        'freezer': 2
    };

    return baseCost[size] * typeMultiplier[type];
}

// Obtener almacenes cercanos
exports.getNearbyWarehouses = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        console.log('[Warehouse] Buscando almacenes cercanos a:', { latitude, longitude });

        // Validar coordenadas
        if (!latitude || !longitude) {
            console.log('[Warehouse] Error: Coordenadas faltantes');
            return res.status(400).json({
                error: 'Se requieren latitud y longitud',
                details: 'Por favor, proporcione las coordenadas en los parámetros de consulta'
            });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
            console.log('[Warehouse] Error: Coordenadas inválidas:', { lat, lon });
            return res.status(400).json({
                error: 'Coordenadas inválidas',
                details: 'La latitud y longitud deben ser números válidos'
            });
        }

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.log('[Warehouse] Error: Coordenadas fuera de rango:', { lat, lon });
            return res.status(400).json({
                error: 'Coordenadas fuera de rango',
                details: 'Latitud debe estar entre -90 y 90, longitud entre -180 y 180'
            });
        }

        console.log('[Warehouse] Consultando almacenes activos...');
        // Obtener todos los almacenes activos
        const warehouses = await Warehouse.findAll({
            where: {
                status: 'active'
            },
            attributes: [
                'warehouseId',
                'name',
                'address',
                'status',
                [sequelize.fn('ST_X', sequelize.col('location')), 'longitude'],
                [sequelize.fn('ST_Y', sequelize.col('location')), 'latitude']
            ],
            include: [
                {
                    model: StorageUnit,
                    as: 'units',
                    attributes: ['status', 'costPerHour']
                }
            ]
        });

        console.log(`[Warehouse] Se encontraron ${warehouses.length} almacenes activos`);

        if (!warehouses.length) {
            return res.status(404).json({
                error: 'No se encontraron almacenes',
                details: 'No hay almacenes activos en el sistema'
            });
        }

        // Procesar y calcular distancias
        const warehousesWithDistance = warehouses.map(warehouse => {
            const warehouseLat = parseFloat(warehouse.getDataValue('latitude'));
            const warehouseLon = parseFloat(warehouse.getDataValue('longitude'));
            
            const distance = calculateDistance(
                lat,
                lon,
                warehouseLat,
                warehouseLon
            );

            const totalUnits = warehouse.units.length;
            const availableUnits = warehouse.units.filter(
                unit => unit.status === 'available'
            ).length;

            // Calcular el costo mínimo por hora de las unidades disponibles
            const availableUnitsCosts = warehouse.units
                .filter(unit => unit.status === 'available' && unit.costPerHour != null)
                .map(unit => Number(unit.costPerHour));

            const costPerHour = availableUnitsCosts.length > 0
                ? Math.min(...availableUnitsCosts)
                : null;

            return {
                id: warehouse.warehouseId,
                name: warehouse.name,
                address: warehouse.address,
                distance: Number(distance.toFixed(2)),
                costPerHour: costPerHour !== null ? Number(costPerHour.toFixed(2)) : null,
                availableUnits,
                totalUnits,
                status: warehouse.status
            };
        });

        // Ordenar por distancia
        warehousesWithDistance.sort((a, b) => a.distance - b.distance);

        console.log(`[Warehouse] Devolviendo ${warehousesWithDistance.length} almacenes ordenados por distancia`);
        res.json(warehousesWithDistance);
    } catch (error) {
        console.error('[Warehouse] Error al buscar almacenes cercanos:', error);
        res.status(500).json({
            error: 'Error al buscar almacenes cercanos',
            details: error.message
        });
    }
}; 