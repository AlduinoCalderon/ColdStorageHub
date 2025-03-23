const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class BookingUnit extends Model {}

BookingUnit.init({
    bookingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'bookings',
            key: 'bookingId'
        }
    },
    unitId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'storageUnits',
            key: 'unitId'
        }
    },
    pricePerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'BookingUnit',
    tableName: 'bookingUnits',
    timestamps: false // Esta tabla no tiene timestamps en el esquema
});

module.exports = BookingUnit;
