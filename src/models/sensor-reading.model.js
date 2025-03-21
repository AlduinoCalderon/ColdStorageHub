const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BaseModel = require('./base.model');

class SensorReading extends BaseModel {
    static init() {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            sensorId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'sensors',
                    key: 'id'
                }
            },
            value: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            unit: {
                type: DataTypes.STRING,
                allowNull: false
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'SensorReading',
            tableName: 'sensor_readings',
            timestamps: true,
            indexes: [
                {
                    fields: ['sensorId', 'timestamp']
                }
            ]
        });
    }

    static associate(models) {
        this.belongsTo(models.Sensor, { foreignKey: 'sensorId', as: 'sensor' });
    }
}

module.exports = SensorReading; 