const User = require('./user.model');
const { Owner, EndUser } = require('./user-adapter');
const Warehouse = require('./warehouse.model');
const StorageUnit = require('./storage-unit.model');
const Booking = require('./booking.model');
const BookingUnit = require('./booking-unit.model');
const IotSensor = require('./iot-sensor.model');
const IotReading = require('./iot-reading.model');
const Payment = require('./payment.model');
const Maintenance = require('./maintenance.model');
const Notification = require('./notification.model');
const setupAssociations = require('./associations');

// Configurar asociaciones
setupAssociations();

module.exports = {
    User,
    Owner,
    EndUser,
    Warehouse,
    StorageUnit,
    Booking,
    BookingUnit,
    IotSensor,
    IotReading,
    Payment,
    Maintenance,
    Notification
};
