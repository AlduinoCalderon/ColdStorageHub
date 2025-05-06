const { Server } = require('socket.io');
const mqttClient = require('../mqtt');

class WebSocketServer {
    constructor() {
        this.io = null;
        this.connectedClients = new Set();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST']
            }
        });

        this.setupEventHandlers();
        console.log('[WebSocket] Server initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Manejar desconexión
            socket.on('disconnect', () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });

            // Opcional: Manejar mensajes del frontend
            socket.on('publish', (data) => {
                if (mqttClient && mqttClient.client) {
                    const { topic, message } = data;
                    mqttClient.client.publish(topic, JSON.stringify(message));
                    console.log(`[WebSocket] Published to MQTT: ${topic}`);
                }
            });
        });
    }

    // Método para emitir mensajes MQTT a todos los clientes conectados
    broadcastMQTTMessage(topic, message) {
        if (this.io) {
            this.io.emit('mqtt-message', {
                topic,
                message
            });
            console.log(`[WebSocket] Broadcasted MQTT message: ${topic}`);
        }
    }

    // Método para emitir mensajes a un cliente específico
    sendToClient(clientId, topic, message) {
        if (this.io) {
            this.io.to(clientId).emit('mqtt-message', {
                topic,
                message
            });
            console.log(`[WebSocket] Sent to client ${clientId}: ${topic}`);
        }
    }
}

module.exports = new WebSocketServer(); 