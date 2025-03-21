const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');

const Warehouse = sequelize.define('Warehouse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'warehouse_id'
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Owners',
            key: 'owner_id'
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
    operating_hours: {
        type: DataTypes.JSON,
        allowNull: true
    },
    amenities: {
        type: DataTypes.JSON,
        allowNull: true
    },
    ...baseFields
}, {
    tableName: 'Warehouses',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at'
});

// Función para configurar las asociaciones
const setupAssociations = (Owner) => {
    Warehouse.belongsTo(Owner, {
        foreignKey: 'owner_id',
        as: 'owner'
    });
};

module.exports = { Warehouse, setupAssociations }; 