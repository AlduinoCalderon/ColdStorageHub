// src/mqtt/index.js
const mqtt = require('mqtt');
const { connectMongoDB } = require('../config/mongodb');
const { Reading } = require('../api/mongodb/models/reading.model');
const websocketServer = require('../websocket');
require('dotenv').config();

// Variable para trackear el estado de la conexión
let isConnected = false;

class MQTTClient {
    constructor() {
        this.client = null;
        this.readingsBuffer = [];
        this.BUFFER_SIZE = 20;
        this.retryCount = 0;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 5000; // 5 segundos
    }

    async connect() {
        await connectMongoDB();
        const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
        const MQTT_USERNAME = process.env.MQTT_USERNAME;
        const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

        const mqttUrl = MQTT_BROKER_URL.startsWith('mqtt://') ? MQTT_BROKER_URL : `mqtt://${MQTT_BROKER_URL}`;
        console.log('[MQTT] Connecting to:', mqttUrl);

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
            console.log('[MQTT] Connected to broker');
            this.client.subscribe('warehouse/unit/+/sensor/+', (err) => {
                if (err) {
                    console.error('[MQTT] Subscription error:', err);
                } else {
                    console.log('[MQTT] Subscribed to sensor topics');
                }
            });
        });

        this.client.on('error', (error) => {
            console.error('[MQTT] Client error:', error);
        });

        this.client.on('reconnect', () => {
            console.log('[MQTT] Reconnecting to broker...');
        });

        this.client.on('offline', () => {
            console.log('[MQTT] Client disconnected');
        });

        this.client.on('close', () => {
            console.log('[MQTT] Connection closed');
        });

        this.client.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(topic, message) {
        try {
            const data = JSON.parse(message);
            const unitId = topic.split('/')[2];
            const sensorType = topic.split('/')[4];
            
            console.log('[MQTT] Received message:', {
                topic,
                unitId,
                sensorType,
                value: data.value,
                timestamp: data.timestamp
            });

            // Reenviar mensaje a través de WebSocket inmediatamente
            websocketServer.broadcastMQTTMessage(topic, {
                unitId,
                sensorType,
                value: parseFloat(data.value),
                timestamp: data.timestamp
            });

            // Verificar si el sensor es de proximidad y el valor es menor a 15
            if ((sensorType === 'proximity1' || sensorType === 'proximity2') && parseFloat(data.value) < 15) {
                console.log(`[MQTT] Space occupied detected in ${sensorType}. Proximity: ${data.value}`);
            }

            // Agregar al buffer para MongoDB
            this.readingsBuffer.push({
                unitId,
                sensorType,
                value: parseFloat(data.value),
                timestamp: new Date(data.timestamp)
            });

            // Procesar buffer si está lleno
            if (this.readingsBuffer.length >= this.BUFFER_SIZE) {
                await this.processReadingsBuffer();
            }
        } catch (error) {
            console.error('[MQTT] Error processing message:', error);
        }
    }

    async processReadingsBuffer() {
        // Definir los tipos de sensor esperados
        const expectedSensors = [
            'proximity1', 'proximity2', 'proximity3', 'proximity4', 'proximity5', 'proximity6',
            'temperature', 'humidity'
        ];

        // Contar lecturas por tipo de sensor
        const sensorCounts = {};
        for (const sensor of expectedSensors) {
            sensorCounts[sensor] = this.readingsBuffer.filter(r => r.sensorType === sensor).length;
        }

        // Verificar si hay al menos 10 lecturas de cada tipo
        const enoughReadings = expectedSensors.every(sensor => sensorCounts[sensor] >= 10);
        if (!enoughReadings) return;

        console.log('🔄 Procesando buffer de lecturas...');
        console.log(`📊 Total de lecturas en buffer: ${this.readingsBuffer.length}`);

        try {
            // Insertar todas las lecturas en MongoDB en una sola operación
            await Reading.insertMany(this.readingsBuffer);
            console.log('✅ Datos guardados en MongoDB exitosamente');

            // Procesar datos para la API
            const tempReadings = this.readingsBuffer.filter(r => r.sensorType === 'temperature');
            const humReadings = this.readingsBuffer.filter(r => r.sensorType === 'humidity');

            console.log(`🌡️  Lecturas de temperatura: ${tempReadings.length}`);
            console.log(`💧 Lecturas de humedad: ${humReadings.length}`);

            const minTemp = Math.min(...tempReadings.map(r => r.value))-1;
            const maxTemp = Math.max(...tempReadings.map(r => r.value))+1;
            const minHumidity = Math.min(...humReadings.map(r => r.value)) - 1;
            const maxHumidity = Math.max(...humReadings.map(r => r.value)) + 1;

            const payload = {
                minTemp: minTemp.toString(),
                maxTemp: maxTemp.toString(),
                minHumidity: minHumidity.toString(),
                maxHumidity: maxHumidity.toString()
            };

            console.log('📤 Enviando datos a la API:', payload);

            const response = await fetch('https://coldstoragehub.onrender.com/API/storage-units/1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'ColdStorageHub-MQTT-Client'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Error de API (${response.status}):`, errorText);
                
                if ((response.status === 429 || response.status === 502) && this.retryCount < this.MAX_RETRIES) {
                    console.log(`⏳ Error ${response.status}. Reintentando en ${this.RETRY_DELAY/1000} segundos...`);
                    this.retryCount++;
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                    return this.processReadingsBuffer();
                }
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const responseData = await response.json();
            console.log('✅ Datos enviados exitosamente a la API:', responseData);
            
            this.readingsBuffer = [];
            this.retryCount = 0;
            console.log('🧹 Buffer limpiado');
        } catch (error) {
            console.error('❌ Error al procesar datos:', error);
            if (this.retryCount < this.MAX_RETRIES) {
                console.log(`🔄 Reintentando en ${this.RETRY_DELAY/1000} segundos...`);
                this.retryCount++;
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                return this.processReadingsBuffer();
            }
            console.log('❌ Máximo número de reintentos alcanzado. Limpiando buffer...');
            this.readingsBuffer = [];
            this.retryCount = 0;
        }
    }
}

// Creamos el cliente solo si MongoDB/MQTT está habilitado
const client = process.env.ENABLE_MONGODB_MQTT === 'true' ? new MQTTClient() : null;

module.exports = client;