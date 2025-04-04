// src/mqtt/index.js
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const IotReading = require('../api/mongodb/models/iot-reading.model');
const IotSensor = require('../api/mongodb/models/iot-sensor.model');
const Reading = require('../api/mongodb/models/Reading');
const { addToBuffer } = require('../api/mongodb/triggers/processReadings');
require('dotenv').config();

// Variable para trackear el estado de la conexión
let isConnected = false;

// Configuración MQTT
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Asegurar que la URL tenga el protocolo
const mqttUrl = MQTT_BROKER_URL.startsWith('mqtt://') ? MQTT_BROKER_URL : `mqtt://${MQTT_BROKER_URL}`;

// Crear cliente MQTT con opciones de reconexión
const client = mqtt.connect(mqttUrl, {
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

// Eventos MQTT
client.on('connect', () => {
    console.log('🔌 Conectado al broker MQTT');
    isConnected = true;
    client.subscribe('warehouse/unit/+/sensor/+', (err) => {
        if (err) {
            console.error('❌ Error al suscribirse:', err);
        } else {
            console.log('✅ Suscrito a tópicos de sensores');
        }
    });
});

client.on('error', (error) => {
    console.error('❌ Error de cliente MQTT:', error);
    console.log('Detalles del error:', error.message);
    isConnected = false;
});

client.on('reconnect', () => {
    console.log('🔄 Reconectando al broker MQTT...');
});

client.on('offline', () => {
    console.log('📴 Cliente MQTT desconectado');
    isConnected = false;
});

client.on('close', () => {
    console.log('🔒 Conexión MQTT cerrada');
});

client.on('message', async (topic, message) => {
    console.log('📥 Mensaje recibido en tópico:', topic);
    console.log('📦 Contenido del mensaje:', message.toString());
    
    try {
        const data = JSON.parse(message);
        const unitId = topic.split('/')[2];
        const sensorType = topic.split('/')[4];
        
        console.log('🔍 Procesando lectura:', {
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });

        // Guardar en MongoDB
        const reading = new Reading({
            unitId,
            sensorType,
            value: data.value,
            timestamp: new Date(data.timestamp)
        });

        await reading.save();
        console.log('💾 Lectura guardada en MongoDB:', reading);

        // Agregar al buffer
        await addToBuffer({
            unitId,
            sensorType,
            value: data.value,
            timestamp: data.timestamp
        });
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
    }
});

// Generar ID único para nuevos sensores
async function generateSensorId() {
  const lastSensor = await IotSensor.findOne().sort({ sensorId: -1 });
  return lastSensor ? lastSensor.sensorId + 1 : 1;
}

// Creamos el cliente solo si MongoDB/MQTT está habilitado
const client = process.env.ENABLE_MONGODB_MQTT === 'true' ? client : null;

module.exports = client;