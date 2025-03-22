const sequelize = require('../config/database');
const userAdapter = require('./user-adapter');
const { DataTypes } = require('sequelize');

// Importar definiciones de modelos
const User = require('./user.model')(sequelize, DataTypes);
const Warehouse = require('./warehouse.model')(sequelize, DataTypes);
const StorageUnit = require('./storage-unit.model')(sequelize, DataTypes);
const Booking = require('./booking.model')(sequelize, DataTypes);
const Sensor = require('./sensor.model')(sequelize, DataTypes);

// Definir asociaciones
// Usuario - Almacenes (Un usuario puede tener muchos almacenes)
User.hasMany(Warehouse, { 
  foreignKey: 'ownerId', 
  as: 'warehouses' 
});
Warehouse.belongsTo(User, { 
  foreignKey: 'ownerId', 
  as: 'owner' 
});

// Almacén - Unidades de almacenamiento
Warehouse.hasMany(StorageUnit, { 
  foreignKey: 'warehouseId', 
  as: 'storageUnits' 
});
StorageUnit.belongsTo(Warehouse, { 
  foreignKey: 'warehouseId', 
  as: 'warehouse' 
});

// Usuario - Reservas
User.hasMany(Booking, { 
  foreignKey: 'userId', 
  as: 'bookings' 
});
Booking.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Unidad de almacenamiento - Reservas
StorageUnit.hasMany(Booking, { 
  foreignKey: 'storageUnitId', 
  as: 'bookings' 
});
Booking.belongsTo(StorageUnit, { 
  foreignKey: 'storageUnitId', 
  as: 'storageUnit' 
});

// Unidad de almacenamiento - Sensores
StorageUnit.hasMany(Sensor, { 
  foreignKey: 'storageUnitId', 
  as: 'sensors' 
});
Sensor.belongsTo(StorageUnit, { 
  foreignKey: 'storageUnitId', 
  as: 'storageUnit' 
});

// Exportar modelos, adaptadores y la instancia de sequelize
module.exports = {
  sequelize,
  User,
  Warehouse,
  StorageUnit,
  Booking,
  Sensor,
  userAdapter
};
