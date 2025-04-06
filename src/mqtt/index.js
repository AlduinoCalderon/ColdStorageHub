// src/mqtt/index.js
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const IotReading = require('../api/mongodb/models/iot-reading.model');
const IotSensor = require('../api/mongodb/models/iot-sensor.model');
const { processMessage } = require('../api/mongodb/triggers/processReadings');
require('dotenv').config();

// Variable para trackear el estado de la conexión
let isConnected = false;

class MQTTClient {
    constructor() {
        this.client = null;
        this.readingsBuffer = [];
        this.BUFFER_SIZE = 20;
    }

    connect() {
        const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
        const MQTT_USERNAME = process.env.MQTT_USERNAME;
        const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

        // Asegurar que la URL tenga el protocolo
        const mqttUrl = MQTT_BROKER_URL.startsWith('mqtt://') ? MQTT_BROKER_URL : `mqtt://${MQTT_BROKER_URL}`;
        console.log('Conectando a MQTT:', mqttUrl);

        this.client = mqtt.connect(mqttUrl, {
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD,
            port: 8883,
            rejectUnauthorized: false,
            protocol: 'mqtts',
            protocolVersion: 4,
            clientId: `warehouse_iot_${Math.random().toString(16).slice(2, 8)}`,
            reconnectPeriod: 5000,
            clean: true,
            keepalive: 60
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('🔌 Conectado al broker MQTT');
            this.client.subscribe('warehouse/unit/+/sensor/+', (err) => {
                if (err) {
                    console.error('❌ Error al suscribirse:', err);
                } else {
                    console.log('✅ Suscrito a tópicos de sensores');
                }
            });
        });

        this.client.on('error', (error) => {
            console.error('❌ Error de cliente MQTT:', error);
            console.log('Detalles del error:', error.message);
        });

        this.client.on('reconnect', () => {
            console.log('🔄 Reconectando al broker MQTT...');
        });

        this.client.on('offline', () => {
            console.log('📴 Cliente MQTT desconectado');
        });

        this.client.on('close', () => {
            console.log('🔒 Conexión MQTT cerrada');
        });

        this.client.on('message', async (topic, message) => {
            await processMessage(topic, message, this.readingsBuffer, this.BUFFER_SIZE);
        });
    }
}

// Generar ID único para nuevos sensores
async function generateSensorId() {
  const lastSensor = await IotSensor.findOne().sort({ sensorId: -1 });
  return lastSensor ? lastSensor.sensorId + 1 : 1;
}

// Creamos el cliente solo si MongoDB/MQTT está habilitado
const client = process.env.ENABLE_MONGODB_MQTT === 'true' ? new MQTTClient() : null;

module.exports = client;