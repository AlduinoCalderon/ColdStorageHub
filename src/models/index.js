const Owner = require('./owner.model');
const { Warehouse, setupAssociations: setupWarehouseAssociations } = require('./warehouse.model');
const StorageUnit = require('./storage-unit.model');
const Booking = require('./booking.model');
const Sensor = require('./sensor.model');
const SensorReading = require('./sensor-reading.model');

// Configurar las asociaciones
setupWarehouseAssociations(Owner);

module.exports = {
    Owner,
    Warehouse,
    StorageUnit,
    Booking,
    Sensor,
    SensorReading
}; 