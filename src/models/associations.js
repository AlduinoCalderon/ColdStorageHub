const User = require('./user.model');
const Warehouse = require('./warehouse.model');
const StorageUnit = require('./storage-unit.model');
const Booking = require('./booking.model');
const BookingUnit = require('./booking-unit.model');
const IotSensor = require('./iot-sensor.model');
const IotReading = require('./iot-reading.model');
const Payment = require('./payment.model');
const Maintenance = require('./maintenance.model');
const Notification = require('./notification.model');

// Configurar las asociaciones
const setupAssociations = () => {
    // User (owner) - Warehouse
    User.hasMany(Warehouse, {
        foreignKey: 'ownerId',
        as: 'warehouses',
        constraints: false,
        scope: {
            role: 'owner'
        }
    });
    
    Warehouse.belongsTo(User, {
        foreignKey: 'ownerId',
        as: 'owner'
    });

    // User (customer) - Booking
    User.hasMany(Booking, {
        foreignKey: 'customerId',
        as: 'bookings',
        constraints: false,
        scope: {
            role: 'customer'
        }
    });
    
    Booking.belongsTo(User, {
        foreignKey: 'customerId',
        as: 'customer'
    });

    // Warehouse - StorageUnit
    Warehouse.hasMany(StorageUnit, {
        foreignKey: 'warehouseId',
        as: 'storageUnits'
    });
    
    StorageUnit.belongsTo(Warehouse, {
        foreignKey: 'warehouseId'
    });

    // Booking - Warehouse
    Booking.belongsTo(Warehouse, {
        foreignKey: 'warehouseId'
    });

    Warehouse.hasMany(Booking, {
        foreignKey: 'warehouseId',
        as: 'bookings'
    });

    // Booking - BookingUnit - StorageUnit
    Booking.belongsToMany(StorageUnit, {
        through: BookingUnit,
        foreignKey: 'bookingId',
        otherKey: 'unitId',
        as: 'units'
    });

    StorageUnit.belongsToMany(Booking, {
        through: BookingUnit,
        foreignKey: 'unitId',
        otherKey: 'bookingId',
        as: 'bookings'
    });

    // StorageUnit - IotSensor
    StorageUnit.hasMany(IotSensor, {
        foreignKey: 'unitId',
        as: 'sensors'
    });

    IotSensor.belongsTo(StorageUnit, {
        foreignKey: 'unitId'
    });

    // IotSensor - IotReading
    IotSensor.hasMany(IotReading, {
        foreignKey: 'sensorId',
        as: 'readings'
    });

    IotReading.belongsTo(IotSensor, {
        foreignKey: 'sensorId'
    });

    // Booking - Payment
    Booking.hasMany(Payment, {
        foreignKey: 'bookingId',
        as: 'payments'
    });

    Payment.belongsTo(Booking, {
        foreignKey: 'bookingId'
    });

    // Warehouse - Maintenance
    Warehouse.hasMany(Maintenance, {
        foreignKey: 'warehouseId',
        as: 'maintenances'
    });

    Maintenance.belongsTo(Warehouse, {
        foreignKey: 'warehouseId'
    });

    // StorageUnit - Maintenance
    StorageUnit.hasMany(Maintenance, {
        foreignKey: 'unitId',
        as: 'maintenances'
    });

    Maintenance.belongsTo(StorageUnit, {
        foreignKey: 'unitId'
    });

    // User - Notification
    User.hasMany(Notification, {
        foreignKey: 'userId',
        as: 'notifications'
    });

    Notification.belongsTo(User, {
        foreignKey: 'userId'
    });
};

module.exports = setupAssociations;
