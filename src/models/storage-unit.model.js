const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');

const StorageUnit = sequelize.define('StorageUnit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    warehouse_id: {
        type: DataTypes.INTEGER,
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
    capacity_m3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    cost_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    temp_range: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    humidity_range: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ...baseFields
}, {
    tableName: 'storage_units',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at'
});

// Función para configurar las asociaciones
const setupAssociations = (Warehouse) => {
    StorageUnit.belongsTo(Warehouse, {
        foreignKey: 'warehouse_id',
        as: 'warehouse'
    });
};

module.exports = { StorageUnit, setupAssociations }; 