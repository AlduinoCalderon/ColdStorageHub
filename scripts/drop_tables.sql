-- Desactivar temporalmente las restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todas las tablas
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS storage_units;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS sensor_readings;
DROP TABLE IF EXISTS sensors;
DROP TABLE IF EXISTS users;

-- Reactivar las restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 1; 