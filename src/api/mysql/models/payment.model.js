const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');

const Payment = sequelize.define('Payment', {
    paymentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bookings',
            key: 'bookingId'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('credit_card', 'bank_transfer', 'paypal'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    }
}, {
    tableName: 'payments',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            unique: true,
            fields: ['transactionId']
        }
    ]
});

module.exports = Payment;
