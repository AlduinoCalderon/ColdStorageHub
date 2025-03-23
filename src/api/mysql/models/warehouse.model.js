const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

const Warehouse = sequelize.define('Warehouse', {
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
    }
}, {
    tableName: 'warehouses',
    paranoid: true
});

module.exports = Warehouse;
