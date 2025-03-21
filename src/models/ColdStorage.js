const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ColdStorage = sequelize.define('ColdStorage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  capacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Capacidad en metros cúbicos'
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Temperatura en grados Celsius'
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = ColdStorage; 