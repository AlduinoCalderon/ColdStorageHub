const { Owner } = require('./owner.model');
const { Warehouse } = require('./warehouse.model');
const { StorageUnit } = require('./storage-unit.model');
const { Booking } = require('./booking.model');
const { EndUser } = require('./end-user.model');
const { IoTSensor } = require('./iot-sensor.model');
const { IoTReading } = require('./iot-reading.model');

// Configurar las asociaciones
Owner.hasMany(Warehouse, {
    foreignKey: 'owner_id',
    as: 'warehouses'
});

Warehouse.belongsTo(Owner, {
    foreignKey: 'owner_id',
    as: 'owner'
});

Warehouse.hasMany(StorageUnit, {
    foreignKey: 'warehouse_id',
    as: 'storageUnits'
});

StorageUnit.belongsTo(Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
});

StorageUnit.belongsToMany(Booking, {
    through: 'Booking_StorageUnits',
    foreignKey: 'unit_id',
    otherKey: 'booking_id',
    as: 'bookings'
});

Booking.belongsToMany(StorageUnit, {
    through: 'Booking_StorageUnits',
    foreignKey: 'booking_id',
    otherKey: 'unit_id',
    as: 'storageUnits'
});

Booking.belongsTo(EndUser, {
    foreignKey: 'end_user_id',
    as: 'endUser'
});

EndUser.hasMany(Booking, {
    foreignKey: 'end_user_id',
    as: 'bookings'
});

IoTSensor.belongsTo(StorageUnit, {
    foreignKey: 'unit_id',
    as: 'storageUnit'
});

IoTReading.belongsTo(IoTSensor, {
    foreignKey: 'sensor_id',
    as: 'sensor'
});

module.exports = {
    Owner,
    Warehouse,
    StorageUnit,
    Booking,
    EndUser,
    IoTSensor,
    IoTReading
}; 