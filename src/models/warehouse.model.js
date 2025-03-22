const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./base.model');
const Sequelize = require('sequelize');

class Warehouse extends BaseModel {}

Warehouse.init({
    warehouseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'maintenance', 'closed'),
        defaultValue: 'active'
    },
    location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    operatingHours: {
        type: DataTypes.JSON,
        allowNull: true
    },
    amenities: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'warehouses'
});

module.exports = Warehouse;
