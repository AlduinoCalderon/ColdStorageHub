const Sensor = require('../models/sensor.model');
const SensorReading = require('../models/sensor-reading.model');
const StorageUnit = require('../models/storage-unit.model');
const Warehouse = require('../models/warehouse.model');

// Crear un nuevo sensor
exports.createSensor = async (req, res) => {
    try {
        const { storage_unit_id, type, location, calibration_date } = req.body;

        // Verificar si la unidad de almacenamiento existe y pertenece al usuario
        const storageUnit = await StorageUnit.findByPk(storage_unit_id, {
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

        if (storageUnit.warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para agregar sensores a esta unidad'
            });
        }

        const sensor = await Sensor.create({
            storage_unit_id,
            type,
            location,
            calibration_date,
            status: 'active'
        });

        res.status(201).json({
            status: 'success',
            data: { sensor }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear el sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los sensores
exports.getAllSensors = async (req, res) => {
    try {
        const sensors = await Sensor.findAll({
            include: [{
                model: StorageUnit,
                as: 'storage_unit',
                include: [{
                    model: Warehouse,
                    as: 'warehouse'
                }]
            }]
        });

        res.json({
            status: 'success',
            results: sensors.length,
            data: { sensors }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los sensores',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un sensor específico
exports.getSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit',
                include: [{
                    model: Warehouse,
                    as: 'warehouse'
                }]
            }]
        });

        if (!sensor) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor no encontrado'
            });
        }

        res.json({
            status: 'success',
            data: { sensor }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar un sensor
exports.updateSensor = async (req, res) => {
    try {
        const { type, location, calibration_date, status } = req.body;
        
        const sensor = await Sensor.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit'
            }]
        });
        
        if (!sensor) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor no encontrado'
            });
        }

        // Verificar si el usuario es el propietario del almacén
        if (sensor.storage_unit.warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para actualizar este sensor'
            });
        }

        // Actualizar campos
        if (type) sensor.type = type;
        if (location) sensor.location = location;
        if (calibration_date) sensor.calibration_date = calibration_date;
        if (status) sensor.status = status;

        await sensor.save();

        res.json({
            status: 'success',
            data: { sensor }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar un sensor (borrado lógico)
exports.deleteSensor = async (req, res) => {
    try {
        const sensor = await Sensor.findByPk(req.params.id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit'
            }]
        });
        
        if (!sensor) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor no encontrado'
            });
        }

        // Verificar si el usuario es el propietario del almacén
        if (sensor.storage_unit.warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para eliminar este sensor'
            });
        }

        await sensor.destroy();

        res.json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Registrar una nueva lectura de sensor
exports.createSensorReading = async (req, res) => {
    try {
        const { sensor_id, temperature, humidity, pressure, battery_level } = req.body;

        // Verificar si el sensor existe y está activo
        const sensor = await Sensor.findByPk(sensor_id, {
            include: [{
                model: StorageUnit,
                as: 'storage_unit'
            }]
        });

        if (!sensor) {
            return res.status(404).json({
                status: 'error',
                message: 'Sensor no encontrado'
            });
        }

        if (sensor.status !== 'active') {
            return res.status(400).json({
                status: 'error',
                message: 'El sensor no está activo'
            });
        }

        const reading = await SensorReading.create({
            sensor_id,
            temperature,
            humidity,
            pressure,
            battery_level
        });

        res.status(201).json({
            status: 'success',
            data: { reading }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al registrar la lectura del sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener lecturas de un sensor
exports.getSensorReadings = async (req, res) => {
    try {
        const { start_time, end_time, limit = 100 } = req.query;
        
        const where = { sensor_id: req.params.id };
        if (start_time || end_time) {
            where.timestamp = {};
            if (start_time) where.timestamp[Op.gte] = start_time;
            if (end_time) where.timestamp[Op.lte] = end_time;
        }

        const readings = await SensorReading.findAll({
            where,
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({
            status: 'success',
            results: readings.length,
            data: { readings }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las lecturas del sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener estadísticas de lecturas
exports.getSensorStats = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;
        
        const where = { sensor_id: req.params.id };
        if (start_time || end_time) {
            where.timestamp = {};
            if (start_time) where.timestamp[Op.gte] = start_time;
            if (end_time) where.timestamp[Op.lte] = end_time;
        }

        const stats = await SensorReading.findAll({
            where,
            attributes: [
                [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
                [sequelize.fn('MIN', sequelize.col('temperature')), 'min_temperature'],
                [sequelize.fn('MAX', sequelize.col('temperature')), 'max_temperature'],
                [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
                [sequelize.fn('MIN', sequelize.col('humidity')), 'min_humidity'],
                [sequelize.fn('MAX', sequelize.col('humidity')), 'max_humidity'],
                [sequelize.fn('AVG', sequelize.col('pressure')), 'avg_pressure'],
                [sequelize.fn('MIN', sequelize.col('battery_level')), 'min_battery_level']
            ],
            raw: true
        });

        res.json({
            status: 'success',
            data: { stats: stats[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las estadísticas del sensor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 