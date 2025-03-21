const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { IoTSensor } = require('./iot-sensor.model');

const IoTReading = sequelize.define('IoTReading', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'reading_id'
    },
    sensor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'IoT_Sensors',
            key: 'sensor_id'
        }
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'IoT_Readings',
    timestamps: false,
    indexes: [
        {
            fields: ['sensor_id', 'recorded_at']
        }
    ]
});

// Función para configurar las asociaciones
const setupAssociations = () => {
    IoTReading.belongsTo(IoTSensor, {
        foreignKey: 'sensor_id',
        as: 'sensor'
    });
};

module.exports = { IoTReading, setupAssociations }; 