// src/config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de conexión a MongoDB Atlas
const connectMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coldstoragehub:1234@coldstoragehub.0j8jq.mongodb.net/ColdStorages?retryWrites=true&w=majority';
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Conectado a MongoDB - Base de datos: ColdStorages');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    console.log('⚠️  Asegúrate de que tu IP está whitelisted en MongoDB Atlas');
    throw error;
  }
};

module.exports = { connectMongoDB };

