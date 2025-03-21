const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./base.model');

class Sensor extends BaseModel {
    static init() {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            storageUnitId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'storage_units',
                    key: 'id'
                }
            },
            type: {
                type: DataTypes.ENUM('temperature', 'humidity', 'co2', 'door'),
                allowNull: false
            },
            serialNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            location: {
                type: DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'error'),
                defaultValue: 'active'
            },
            lastReading: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            lastReadingAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            calibrationDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Sensor',
            tableName: 'sensors',
            timestamps: true
        });
    }

    static associate(models) {
        this.belongsTo(models.StorageUnit, { foreignKey: 'storageUnitId', as: 'storageUnit' });
        this.hasMany(models.SensorReading, { foreignKey: 'sensorId', as: 'readings' });
    }
}

module.exports = Sensor; 