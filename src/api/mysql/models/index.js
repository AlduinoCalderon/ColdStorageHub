const User = require('./user.model');
const Warehouse = require('./warehouse.model');
const StorageUnit = require('./storage-unit.model');
const Booking = require('./booking.model');
const BookingUnit = require('./booking-unit.model');
const Payment = require('./payment.model');

// Asociaciones User - Warehouse
User.hasMany(Warehouse, {
    foreignKey: 'ownerId',
    as: 'warehouses'
});
Warehouse.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
});

// Asociaciones Warehouse - StorageUnit
Warehouse.hasMany(StorageUnit, {
    foreignKey: 'warehouseId',
    as: 'units'
});
StorageUnit.belongsTo(Warehouse, {
    foreignKey: 'warehouseId',
    as: 'warehouse'
});

// Asociaciones User - Booking (como cliente)
User.hasMany(Booking, {
    foreignKey: 'customerId',
    as: 'bookings'
});
Booking.belongsTo(User, {
    foreignKey: 'customerId',
    as: 'customer'
});

// Asociaciones Warehouse - Booking
Warehouse.hasMany(Booking, {
    foreignKey: 'warehouseId',
    as: 'bookings'
});
Booking.belongsTo(Warehouse, {
    foreignKey: 'warehouseId',
    as: 'warehouse'
});

// Asociaciones Booking - StorageUnit (a través de BookingUnit)
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

// Asociaciones Booking - Payment
Booking.hasMany(Payment, {
    foreignKey: 'bookingId',
    as: 'payments'
});
Payment.belongsTo(Booking, {
    foreignKey: 'bookingId',
    as: 'booking'
});

module.exports = {
    User,
    Warehouse,
    StorageUnit,
    Booking,
    BookingUnit,
    Payment
}; 