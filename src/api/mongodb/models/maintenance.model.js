const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('../../../models/base.model');

class Maintenance extends BaseModel {}

Maintenance.init({
    maintenanceId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'warehouses',
            key: 'warehouseId'
        }
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'storageUnits',
            key: 'unitId'
        }
    },
    type: {
        type: DataTypes.ENUM('preventive', 'corrective', 'emergency'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // downtimeHours es un campo generado en la BD, no necesita definirse aquí
}, {
    sequelize,
    modelName: 'Maintenance',
    tableName: 'maintenance',
    paranoid: false // Esta tabla no tiene deleted_at
});

module.exports = Maintenance;
