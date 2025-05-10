const express = require('express');
const router = express.Router();
const { Reading } = require('../models/reading.model');

// GET /api/mongodb/readings/proximity - Get latest proximity sensor readings (Public)
router.get('/readings/proximity', async (req, res) => {
    try {
        const { unitId } = req.query;
        const baseQuery = unitId ? { unitId } : {};

        // Get latest reading for proximity1
        const latestProximity1 = await Reading.findOne({
            ...baseQuery,
            sensorType: 'proximity1'
        })
        .sort({ timestamp: -1 })
        .select('unitId sensorType value timestamp -_id')
        .lean();

        // Get latest reading for proximity2
        const latestProximity2 = await Reading.findOne({
            ...baseQuery,
            sensorType: 'proximity2'
        })
        .sort({ timestamp: -1 })
        .select('unitId sensorType value timestamp -_id')
        .lean();

        const response = {
            proximity1: latestProximity1 || null,
            proximity2: latestProximity2 || null,
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ 
            error: 'Error fetching latest proximity readings',
            details: error.message 
        });
    }
});

// GET /api/mongodb/readings/temperature - Get latest temperature readings (Public)
router.get('/readings/temperature', async (req, res) => {
    try {
        const { unitId } = req.query;
        const baseQuery = unitId ? { unitId } : {};

        const latestTemp = await Reading.findOne({
            ...baseQuery,
            sensorType: 'temperature'
        })
        .sort({ timestamp: -1 })
        .select('unitId sensorType value timestamp -_id')
        .lean();

        res.json({
            temperature: latestTemp || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ 
            error: 'Error fetching temperature readings',
            details: error.message 
        });
    }
});

// GET /api/mongodb/readings/humidity - Get latest humidity readings (Public)
router.get('/readings/humidity', async (req, res) => {
    try {
        const { unitId } = req.query;
        const baseQuery = unitId ? { unitId } : {};

        const latestHumidity = await Reading.findOne({
            ...baseQuery,
            sensorType: 'humidity'
        })
        .sort({ timestamp: -1 })
        .select('unitId sensorType value timestamp -_id')
        .lean();

        res.json({
            humidity: latestHumidity || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ 
            error: 'Error fetching humidity readings',
            details: error.message 
        });
    }
});

// GET /api/mongodb/readings - Get historical readings with filters (Public)
router.get('/readings', async (req, res) => {
    try {
        const { sensorType, unitId, limit = 100 } = req.query;
        
        const query = {};
        if (sensorType) query.sensorType = sensorType;
        if (unitId) query.unitId = unitId;

        const readings = await Reading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select('unitId sensorType value timestamp -_id');

        res.json({
            readings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ 
            error: 'Error fetching readings',
            details: error.message 
        });
    }
});

// GET /api/mongodb/readings/unit/:unitId/latest - Get latest readings for a specific unit (Public)
router.get('/readings/unit/:unitId/latest', async (req, res) => {
    try {
        const { unitId } = req.params;
        
        const latestReadings = await Reading.find({ unitId })
            .sort({ timestamp: -1 })
            .limit(1)
            .select('unitId sensorType value timestamp -_id');

        res.json({
            readings: latestReadings[0] || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ 
            error: 'Error fetching latest readings',
            details: error.message 
        });
    }
});

// Ruta pública para el visualizador
router.get('/visualizer/readings', async (req, res) => {
    try {
        const readings = await Reading.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .select('value timestamp sensorId unitId -_id');
        
        res.json({
            status: 'success',
            data: readings
        });
    } catch (error) {
        console.error('[MongoDB] Error fetching readings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching readings'
        });
    }
});

module.exports = router; 