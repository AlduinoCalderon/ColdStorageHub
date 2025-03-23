const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

const Warehouse = sequelize.define('Warehouse', {
    warehouseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'warehouseId'
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'ownerId',
        references: {
            model: 'users',
            key: 'userId'
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'name'
    },
    status: {
        type: DataTypes.ENUM('active', 'maintenance', 'closed'),
        defaultValue: 'active',
        field: 'status'
    },
    location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false,
        field: 'location'
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'address'
    },
    operatingHours: {
        type: DataTypes.JSON,
        field: 'operatingHours'
    },
    amenities: {
        type: DataTypes.JSON,
        field: 'amenities'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'createdAt'
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updatedAt'
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deletedAt'
    }
}, {
    tableName: 'warehouses',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    indexes: [
        {
            type: 'SPATIAL',
            fields: ['location']
        }
    ]
});

module.exports = Warehouse;
