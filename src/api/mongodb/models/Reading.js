const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    unitId: Number,
    sensorType: String,
    value: Number,
    timestamp: Date
});

module.exports = mongoose.model('Reading', ReadingSchema); 