// src/config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de conexión a MongoDB Atlas
const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Propagar el error para manejo superior
  }
};

module.exports = { connectMongoDB };

// Agregar estas variables a tu archivo .env existente:
/*
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warehouse-iot?retryWrites=true&w=majority
ENABLE_MONGODB_MQTT=true

# MQTT Config
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
*/