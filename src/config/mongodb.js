// src/config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de conexión a MongoDB Atlas
const connectMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alduinocalderon:2NHOgLKgVBwQPsUh@coldconnect.9eqrjts.mongodb.net/ColdStorages?retryWrites=true&w=majority&appName=ColdConnect';
    
    await mongoose.connect(MONGODB_URI, {
      dbName: 'ColdStorages'
    });
    
    const db = mongoose.connection.db;
    console.log(`[MongoDB] Connected to ${db.databaseName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
};

module.exports = { connectMongoDB };

