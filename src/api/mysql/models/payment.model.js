const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/mysql');
const BaseModel = require('../../../models/base.model');

class Payment extends BaseModel {}

Payment.init({
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
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    // Esta tabla sólo tiene createdAt y updatedAt, no deletedAt
    paranoid: false
});

module.exports = Payment;
