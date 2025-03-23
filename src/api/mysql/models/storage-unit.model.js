const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

const StorageUnit = sequelize.define('StorageUnit', {
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
    costPerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'),
        defaultValue: 'available'
    }
}, {
    tableName: 'storageUnits',
    paranoid: true
});

module.exports = StorageUnit; 