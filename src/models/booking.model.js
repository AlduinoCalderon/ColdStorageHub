const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./base.model');

class Booking extends BaseModel {
    static init() {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            storageUnitId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'storage_units',
                    key: 'id'
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
            totalPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            paymentStatus: {
                type: DataTypes.ENUM('pending', 'paid', 'refunded'),
                defaultValue: 'pending'
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Booking',
            tableName: 'bookings',
            timestamps: true
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.StorageUnit, { foreignKey: 'storageUnitId', as: 'storageUnit' });
    }
}

module.exports = Booking; 