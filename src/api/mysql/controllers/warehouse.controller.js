const { Warehouse, User, StorageUnit } = require('../models');

// Obtener todos los almacenes
exports.getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.findAll({
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
        res.json(warehouses);
    } catch (error) {
        console.error('Error al obtener almacenes:', error);
        res.status(500).json({ message: 'Error al obtener almacenes' });
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
            return res.status(404).json({ message: 'Almacén no encontrado' });
        }
        
        res.json(warehouse);
    } catch (error) {
        console.error('Error al obtener almacén:', error);
        res.status(500).json({ message: 'Error al obtener almacén' });
    }
};

// Crear un nuevo almacén
exports.createWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.create(req.body);
        res.status(201).json(warehouse);
    } catch (error) {
        console.error('Error al crear almacén:', error);
        res.status(500).json({ message: 'Error al crear almacén' });
    }
};

// Actualizar un almacén
exports.updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({ message: 'Almacén no encontrado' });
        }
        
        await warehouse.update(req.body);
        res.json(warehouse);
    } catch (error) {
        console.error('Error al actualizar almacén:', error);
        res.status(500).json({ message: 'Error al actualizar almacén' });
    }
};

// Eliminar un almacén
exports.deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.id);
        
        if (!warehouse) {
            return res.status(404).json({ message: 'Almacén no encontrado' });
        }
        
        await warehouse.destroy();
        res.json({ message: 'Almacén eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar almacén:', error);
        res.status(500).json({ message: 'Error al eliminar almacén' });
    }
}; 