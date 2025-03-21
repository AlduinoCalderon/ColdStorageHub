const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');
const { StorageUnit } = require('./storage-unit.model');

const IoTSensor = sequelize.define('IoTSensor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'sensor_id'
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'StorageUnits',
            key: 'unit_id'
        }
    },
    sensor_type: {
        type: DataTypes.ENUM('temperature', 'humidity', 'motion'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'error'),
        defaultValue: 'active'
    },
    ...baseFields
}, {
    tableName: 'IoT_Sensors',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at'
});

// Función para configurar las asociaciones
const setupAssociations = () => {
    IoTSensor.belongsTo(StorageUnit, {
        foreignKey: 'unit_id',
        as: 'storageUnit'
    });
};

module.exports = { IoTSensor, setupAssociations }; 