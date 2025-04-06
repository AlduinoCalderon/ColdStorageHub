const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
    unitId: {
        type: String,
        required: true
    },
    sensorType: {
        type: String,
        required: true,
        enum: ['temperature', 'humidity']
    },
    value: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    collection: 'Readings',
    timestamps: true
});

module.exports = mongoose.model('Reading', readingSchema); 