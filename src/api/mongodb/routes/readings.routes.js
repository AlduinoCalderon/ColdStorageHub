const express = require('express');
const router = express.Router();
const { Reading } = require('../models/reading.model');

// GET /api/mongodb/readings/proximity - Get latest proximity sensor readings
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

        // Si se especificó un unitId y no se encontraron lecturas, devolver 404
        if (unitId && !latestProximity1 && !latestProximity2) {
            return res.status(404).json({ 
                error: `No proximity readings found for unit ${unitId}` 
            });
        }

        const response = {
            proximity1: latestProximity1 || null,
            proximity2: latestProximity2 || null
        };

        res.json(response);
    } catch (error) {
        console.error('[Readings] Error:', error.message);
        res.status(500).json({ error: 'Error fetching latest proximity readings from database' });
    }
});

// GET /api/mongodb/readings - Get historical readings with filters
router.get('/readings', async (req, res) => {
    try {
        const { sensorType, limit = 100 } = req.query;
        
        const query = {};
        if (sensorType) {
            query.sensorType = sensorType;
        }

        const readings = await Reading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select('unitId sensorType value timestamp -_id');

        res.json(readings);
    } catch (error) {
        console.error('Error fetching readings:', error);
        res.status(500).json({ error: 'Error fetching readings from database' });
    }
});

// GET /api/mongodb/readings/unit/:unitId/latest - Get latest reading for a specific unit
router.get('/readings/unit/:unitId/latest', async (req, res) => {
    try {
        const { unitId } = req.params;
        
        const latestReading = await Reading.findOne({ unitId })
            .sort({ timestamp: -1 })
            .select('unitId sensorType value timestamp -_id');

        if (!latestReading) {
            return res.status(404).json({ error: 'No readings found for this unit' });
        }

        res.json(latestReading);
    } catch (error) {
        console.error('Error fetching latest reading:', error);
        res.status(500).json({ error: 'Error fetching latest reading from database' });
    }
});

module.exports = router; 