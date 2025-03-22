const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingUnit = sequelize.define('BookingUnit', {
    bookingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: 'bookingId',
        references: {
            model: 'bookings',
            key: 'bookingId'
        }
    },
    unitId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: 'unitId',
        references: {
            model: 'storageUnits',
            key: 'unitId'
        }
    },
    pricePerHour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'pricePerHour'
    }
}, {
    tableName: 'bookingUnits',
    timestamps: false
});

// Asociaciones
BookingUnit.associate = (models) => {
    BookingUnit.belongsTo(models.Booking, {
        foreignKey: 'bookingId'
    });
    
    BookingUnit.belongsTo(models.StorageUnit, {
        foreignKey: 'unitId'
    });
};

module.exports = BookingUnit;
