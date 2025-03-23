const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('../../../models/base.model');

class Warehouse extends BaseModel {}

Warehouse.init({
    warehouseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'warehouses'
});

module.exports = Warehouse;
