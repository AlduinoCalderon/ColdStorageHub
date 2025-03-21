-- Desactivar temporalmente las restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar datos de todas las tablas
TRUNCATE TABLE bookings;
TRUNCATE TABLE storage_units;
TRUNCATE TABLE warehouses;
TRUNCATE TABLE sensor_readings;
TRUNCATE TABLE sensors;
TRUNCATE TABLE users;

-- Reactivar las restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 1; 