const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');
const { Booking } = require('./booking.model');

const EndUser = sequelize.define('EndUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'end_user_id'
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
    tableName: 'EndUsers',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at'
});

// Función para configurar las asociaciones
const setupAssociations = () => {
    EndUser.hasMany(Booking, {
        foreignKey: 'end_user_id',
        as: 'bookings'
    });
};

module.exports = { EndUser, setupAssociations }; 