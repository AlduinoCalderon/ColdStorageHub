// src/config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de conexión a MongoDB Atlas
const connectMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coldstoragehub:1234@coldstoragehub.0j8jq.mongodb.net/ColdStorages?retryWrites=true&w=majority';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado a MongoDB - Base de datos: ColdStorages');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    console.log('⚠️  Asegúrate de que tu IP está whitelisted en MongoDB Atlas');
    throw error;
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