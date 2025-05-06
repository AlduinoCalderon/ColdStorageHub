const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
    unitId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
}, { 
    collection: 'Readings',
    versionKey: false
});

// Asegurarnos de que el modelo use la base de datos correcta
const Reading = mongoose.model('Reading', readingSchema, 'Readings');

module.exports = { Reading }; 