// src/config/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Configuración de conexión a MongoDB Atlas
const connectMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
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

