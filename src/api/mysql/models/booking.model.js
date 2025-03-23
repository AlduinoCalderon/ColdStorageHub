const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

const Booking = sequelize.define('Booking', {
    bookingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'userId'
        }
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'warehouses',
            key: 'warehouseId'
        }
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'bookings',
    timestamps: true,
    paranoid: true,
    validate: {
        dateRangeValid() {
            if (this.startDate >= this.endDate) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        }
    }
});

module.exports = Booking;
