const express = require('express');
const router = express.Router();
const { testConnection: testMySQLConnection } = require('../../../config/mysql');
const { connectMongoDB } = require('../../../config/mongodb');
const mqttClient = require('../../../mqtt');
const Logger = require('../../../utils/logger');

let lastExternalHealthCheck = null;
let externalHealthStatus = null;

// Función para verificar la salud de la API externa
async function checkExternalHealth() {
    try {
        const response = await fetch('https://server-http-mfxe.onrender.com/api/health');
        const data = await response.json();
        externalHealthStatus = data;
        lastExternalHealthCheck = new Date();
        Logger.success('External API health check completed');
    } catch (error) {
        Logger.error(`External API health check failed: ${error.message}`);
        externalHealthStatus = { status: 'ERROR', error: error.message };
    }
}

// Verificar la salud externa cada 5 minutos
setInterval(checkExternalHealth, 5 * 60 * 1000);

// Endpoint de health check
router.get('/health', async (req, res) => {
    try {
        // Verificar MySQL
        const mysqlStatus = await testMySQLConnection();
        
        // Verificar MongoDB
        const mongooseConnection = await connectMongoDB();
        
        // Respuesta inmediata con estado actual
        const healthStatus = {
            status: 'OK',
            mqtt: mqttClient.client ? mqttClient.client.connected : false,
            mongodb: mongooseConnection.readyState === 1,
            mysql: mysqlStatus,
            externalApi: {
                status: externalHealthStatus,
                lastChecked: lastExternalHealthCheck
            }
        };

        // Log del estado de salud
        Logger.health(healthStatus);

        res.json(healthStatus);

        // Si no se ha verificado la API externa o la última verificación fue hace más de 5 minutos
        if (!lastExternalHealthCheck || (new Date() - lastExternalHealthCheck) > 5 * 60 * 1000) {
            checkExternalHealth();
        }
    } catch (error) {
        Logger.error(`Health check failed: ${error.message}`);
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

module.exports = router; 