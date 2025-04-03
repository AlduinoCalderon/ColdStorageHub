// src/mqtt/index.js
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const IotReading = require('../api/mongodb/models/iot-reading.model');
const IotSensor = require('../api/mongodb/models/iot-sensor.model');
require('dotenv').config();

// Variable para trackear el estado de la conexión
let isConnected = false;

// Función para crear el cliente MQTT
function createMqttClient() {
  // Solo crear si está configurado
  if (!process.env.MQTT_BROKER_URL) {
    console.warn('MQTT_BROKER_URL not set, MQTT services disabled');
    return null;
  }

  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `warehouse_iot_${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000 // Reconectar cada 5 segundos si se pierde conexión
  });

  // Topic structure: warehouse/unit/{unitId}/sensor/{sensorType}
  const topicPattern = 'warehouse/unit/+/sensor/+';

  client.on('connect', () => {
    console.log('🔌 Conectado al broker MQTT');
    isConnected = true;
    
    client.subscribe(topicPattern, (err) => {
      if (err) {
        console.error('❌ Error de suscripción MQTT:', err);
      } else {
        console.log(`✅ Suscrito a ${topicPattern}`);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const topicParts = topic.split('/');
      
      // Verificar estructura del topic
      if (topicParts.length !== 5) {
        console.error('❌ Estructura de topic inválida:', topic);
        return;
      }
      
      const unitId = parseInt(topicParts[2]);
      const sensorType = topicParts[4];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📥 [${sensorType}] Mensaje recibido para unidad ${unitId}`);
      }
      
      // Parsear payload
      const payload = JSON.parse(message.toString());
      const { value, timestamp = new Date() } = payload;
      
      // Buscar el sensor por unitId y sensorType
      let sensor = await IotSensor.findOne({ unitId, sensorType });
      
      // Si el sensor no existe, lo creamos
      if (!sensor) {
        console.log(`🆕 Creando nuevo sensor para unitId: ${unitId}, tipo: ${sensorType}`);
        sensor = new IotSensor({
          sensorId: await generateSensorId(),
          unitId,
          sensorType,
          status: 'active',
          mqttTopic: topic
        });
        await sensor.save();
      }
      
      // Crear nueva lectura
      const reading = new IotReading({
        sensorId: sensor._id,
        value,
        recordedAt: new Date(timestamp)
      });
      
      await reading.save();
      
      // Actualizar última lectura del sensor
      sensor.lastReading = {
        value,
        timestamp: new Date(timestamp)
      };
      await sensor.save();
      
    } catch (error) {
      console.error('❌ Error procesando mensaje MQTT:', error);
    }
  });

  // Manejo de errores MQTT
  client.on('error', (error) => {
    console.error('❌ Error de cliente MQTT:', error);
    isConnected = false;
  });

  client.on('reconnect', () => {
    console.log('🔄 Reconectando al broker MQTT...');
  });

  client.on('offline', () => {
    console.log('📴 Cliente MQTT desconectado');
    isConnected = false;
  });

  return client;
}

// Generar ID único para nuevos sensores
async function generateSensorId() {
  const lastSensor = await IotSensor.findOne().sort({ sensorId: -1 });
  return lastSensor ? lastSensor.sensorId + 1 : 1;
}

// Creamos el cliente solo si MongoDB/MQTT está habilitado
const client = process.env.ENABLE_MONGODB_MQTT === 'true' ? createMqttClient() : null;

module.exports = client;