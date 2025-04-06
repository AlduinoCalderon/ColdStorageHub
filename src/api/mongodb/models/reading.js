const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
    unitId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
}, { collection: 'Readings' });

const Reading = mongoose.model('Reading', readingSchema);

module.exports = { Reading }; 