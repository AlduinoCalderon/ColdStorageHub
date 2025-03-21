const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { Sensor } = require('../models');

// Rutas públicas para lecturas de sensores
router.post('/readings', sensorController.createSensorReading);

// Rutas protegidas
router.use(authMiddleware.protect);

// Rutas para propietarios y admin
router.post('/',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkWarehouseOwnership,
    sensorController.createSensor
);

router.get('/', sensorController.getAllSensors);
router.get('/:id', sensorController.getSensor);
router.get('/:id/readings', sensorController.getSensorReadings);
router.get('/:id/stats', sensorController.getSensorStats);

router.patch('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(Sensor),
    sensorController.updateSensor
);

router.delete('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(Sensor),
    sensorController.deleteSensor
);

module.exports = router; 