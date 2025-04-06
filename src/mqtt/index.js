// src/mqtt/index.js
const mqtt = require('mqtt');
const { Reading } = require('../api/mongodb/models/reading.model');
require('dotenv').config();

// Variable para trackear el estado de la conexión
let isConnected = false;

class MQTTClient {
    constructor() {
        this.client = null;
        this.readingsBuffer = [];
        this.BUFFER_SIZE = 20;
    }

    async connect() {
        const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
        const MQTT_USERNAME = process.env.MQTT_USERNAME;
        const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

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

        this.client.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(topic, message) {
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
            this.readingsBuffer.push({
                unitId,
                sensorType,
                value: data.value,
                timestamp: data.timestamp
            });

            console.log(`📊 Buffer actual: ${this.readingsBuffer.length}/${this.BUFFER_SIZE} lecturas`);

            // Procesar buffer si está lleno
            if (this.readingsBuffer.length >= this.BUFFER_SIZE) {
                await this.processReadingsBuffer();
            }
        } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
        }
    }

    async processReadingsBuffer() {
        if (this.readingsBuffer.length < this.BUFFER_SIZE) return;

        console.log('🔄 Procesando buffer de lecturas...');
        console.log(`📊 Total de lecturas en buffer: ${this.readingsBuffer.length}`);

        const tempReadings = this.readingsBuffer.filter(r => r.sensorType === 'temperature');
        const humReadings = this.readingsBuffer.filter(r => r.sensorType === 'humidity');

        console.log(`🌡️  Lecturas de temperatura: ${tempReadings.length}`);
        console.log(`💧 Lecturas de humedad: ${humReadings.length}`);

        const minTemp = Math.min(...tempReadings.map(r => r.value));
        const maxTemp = Math.max(...tempReadings.map(r => r.value));
        const minHumidity = Math.min(...humReadings.map(r => r.value));
        const maxHumidity = Math.max(...humReadings.map(r => r.value));

        const payload = {
            minTemp: minTemp.toString(),
            maxTemp: maxTemp.toString(),
            minHumidity: minHumidity.toString(),
            maxHumidity: maxHumidity.toString()
        };

        console.log('📤 Enviando datos a la API:', payload);

        try {
            const response = await fetch('https://coldstoragehub.onrender.com/API/storage-unit/1', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('✅ Datos enviados exitosamente a la API:', responseData);
            
            this.readingsBuffer = [];
            console.log('🧹 Buffer limpiado');
        } catch (error) {
            console.error('❌ Error al enviar datos a la API:', error);
        }
    }
}

// Creamos el cliente solo si MongoDB/MQTT está habilitado
const client = process.env.ENABLE_MONGODB_MQTT === 'true' ? new MQTTClient() : null;

module.exports = client;