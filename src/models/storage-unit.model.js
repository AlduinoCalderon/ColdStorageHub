const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./base.model');

class StorageUnit extends BaseModel {}

StorageUnit.init({
    unitId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'warehouses',
            key: 'warehouseId'
        }
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    width: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    height: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    depth: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    costPerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    minTemp: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    maxTemp: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    minHumidity: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    maxHumidity: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'),
        defaultValue: 'available'
    }
}, {
    sequelize,
    modelName: 'StorageUnit',
    tableName: 'storageUnits'
});

module.exports = StorageUnit;
