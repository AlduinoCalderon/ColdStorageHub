const express = require('express');
const router = express.Router();
const { testConnection: testMySQLConnection } = require('../../../config/mysql');
const { connectMongoDB } = require('../../../config/mongodb');
const mqttClient = require('../../../mqtt');
const Logger = require('../../../utils/logger');

let lastExternalHealthCheck = null;
let externalHealthStatus = null;
let lastAnimalesHealthCheck = null;
let animalesHealthStatus = null;

// Función para verificar la salud de las APIs externas
async function checkExternalHealth() {
    try {
        // Verificar primera API
        const response1 = await fetch('https://server-http-mfxe.onrender.com/api/health');
        const data1 = await response1.json();
        externalHealthStatus = data1;
        
        // Verificar segunda API
        const response2 = await fetch('https://animales.onrender.com/health');
        const data2 = await response2.json();
        animalesHealthStatus = data2;
        
        lastExternalHealthCheck = new Date();
        lastAnimalesHealthCheck = new Date();
        Logger.success('External APIs health check completed');
    } catch (error) {
        Logger.error(`External APIs health check failed: ${error.message}`);
        externalHealthStatus = { status: 'ERROR', error: error.message };
        animalesHealthStatus = { status: 'ERROR', error: error.message };
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
            externalApis: {
                server: {
                    status: externalHealthStatus,
                    lastChecked: lastExternalHealthCheck
                },
                animales: {
                    status: animalesHealthStatus,
                    lastChecked: lastAnimalesHealthCheck
                }
            }
        };

        // Log del estado de salud
        Logger.health(healthStatus);

        res.json(healthStatus);

        // Si no se ha verificado las APIs externas o la última verificación fue hace más de 5 minutos
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