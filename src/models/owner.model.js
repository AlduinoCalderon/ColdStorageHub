const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');

const Owner = sequelize.define('Owner', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'owner_id'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    ...baseFields
}, {
    tableName: 'Owners',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at'
});

module.exports = Owner; 