const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const baseFields = require('./base.model');
const { EndUser } = require('./end-user.model');
const { StorageUnit } = require('./storage-unit.model');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'booking_id'
    },
    end_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'EndUsers',
            key: 'end_user_id'
        }
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ...baseFields
}, {
    tableName: 'Bookings',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    validate: {
        dateOrder() {
            if (this.start_date >= this.end_date) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        }
    }
});

// Función para configurar las asociaciones
const setupAssociations = () => {
    Booking.belongsTo(EndUser, {
        foreignKey: 'end_user_id',
        as: 'endUser'
    });
    
    Booking.belongsToMany(StorageUnit, {
        through: 'Booking_StorageUnits',
        foreignKey: 'booking_id',
        otherKey: 'unit_id',
        as: 'storageUnits'
    });
};

module.exports = { Booking, setupAssociations }; 