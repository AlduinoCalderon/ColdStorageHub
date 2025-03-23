const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('../../../models/base.model');

class IotSensor extends BaseModel {}

IotSensor.init({
    sensorId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'storageUnits',
            key: 'unitId'
        }
    },
    sensorType: {
        type: DataTypes.ENUM('temperature', 'humidity', 'motion', 'door'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'error'),
        defaultValue: 'active'
    }
}, {
    sequelize,
    modelName: 'IotSensor',
    tableName: 'iotSensors'
});

module.exports = IotSensor;
