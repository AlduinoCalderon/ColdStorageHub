const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class IotReading extends Model {}

IotReading.init({
    readingId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    sensorId: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        allowNull: false,
        references: {
            model: 'iotSensors',
            key: 'sensorId'
        }
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        primaryKey: true
    }
}, {
    sequelize,
    modelName: 'IotReading',
    tableName: 'iotReadings',
    timestamps: false // Esta tabla no usa los timestamps estándar
});

module.exports = IotReading;
