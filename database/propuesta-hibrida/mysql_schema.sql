-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    userId INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'customer') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL DEFAULT NULL
);

-- Tabla de Almacenes
CREATE TABLE IF NOT EXISTS warehouses (
    warehouseId INT PRIMARY KEY AUTO_INCREMENT,
    ownerId INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active',
    location POINT NOT NULL,
    address VARCHAR(255) NOT NULL,
    operatingHours JSON,
    amenities JSON,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL DEFAULT NULL,
    FOREIGN KEY (ownerId) REFERENCES users(userId) ON DELETE CASCADE
);

-- Índice geoespacial para búsquedas por ubicación
CREATE SPATIAL INDEX idx_location ON warehouses(location);

-- Tabla de Unidades de Almacenamiento
CREATE TABLE IF NOT EXISTS storageUnits (
    unitId INT PRIMARY KEY AUTO_INCREMENT,
    warehouseId INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    depth DECIMAL(5,2) NOT NULL,
    costPerHour DECIMAL(10,2) NOT NULL,
    minTemp DECIMAL(5,2) NOT NULL,
    maxTemp DECIMAL(5,2) NOT NULL,
    minHumidity DECIMAL(5,2) NOT NULL,
    maxHumidity DECIMAL(5,2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL DEFAULT NULL,
    FOREIGN KEY (warehouseId) REFERENCES warehouses(warehouseId) ON DELETE CASCADE,
    CONSTRAINT chk_temp_range CHECK (minTemp < maxTemp),
    CONSTRAINT chk_humidity_range CHECK (minHumidity < maxHumidity)
);

-- Índices para rangos de temperatura y humedad
CREATE INDEX idx_temp_range ON storageUnits(minTemp, maxTemp);
CREATE INDEX idx_humidity_range ON storageUnits(minHumidity, maxHumidity);

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS bookings (
    bookingId INT PRIMARY KEY AUTO_INCREMENT,
    customerId INT NOT NULL,
    warehouseId INT NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    notes TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL DEFAULT NULL,
    CONSTRAINT chk_booking_dates CHECK (startDate < endDate),
    FOREIGN KEY (customerId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (warehouseId) REFERENCES warehouses(warehouseId) ON DELETE CASCADE
);

-- Tabla de relación entre Reservas y Unidades
CREATE TABLE IF NOT EXISTS bookingUnits (
    bookingId INT NOT NULL,
    unitId INT NOT NULL,
    pricePerHour DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (bookingId, unitId),
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId) ON DELETE CASCADE,
    FOREIGN KEY (unitId) REFERENCES storageUnits(unitId) ON DELETE CASCADE
);

-- Tabla de Sensores IoT
CREATE TABLE iotSensors (
    sensorId INT PRIMARY KEY AUTO_INCREMENT,
    unitId INT NOT NULL,
    sensorType ENUM('temperature', 'humidity', 'motion', 'door') NOT NULL,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL DEFAULT NULL,
    FOREIGN KEY (unitId) REFERENCES storageUnits(unitId) ON DELETE CASCADE
);

-- Tabla de Lecturas IoT (Particionada por año)
CREATE TABLE iotReadings (
    readingId INT NOT NULL,
    sensorId INT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    recordedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (readingId, recordedAt)
) PARTITION BY RANGE (YEAR(recordedAt)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Índice para facilitar búsquedas por sensorId
CREATE INDEX idx_sensor_id ON iotReadings(sensorId);
-- Índice para búsquedas por fecha
CREATE INDEX idx_recorded_at ON iotReadings(recordedAt);

-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    paymentId INT PRIMARY KEY AUTO_INCREMENT,
    bookingId INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentMethod ENUM('credit_card', 'bank_transfer', 'paypal') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transactionId VARCHAR(100),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId) ON DELETE CASCADE,
    UNIQUE INDEX idx_transaction (transactionId)
);

-- Tabla de Mantenimiento
CREATE TABLE maintenance (
    maintenanceId INT PRIMARY KEY AUTO_INCREMENT,
    warehouseId INT NOT NULL,
    unitId INT,
    type ENUM('preventive', 'corrective', 'emergency') NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    description TEXT NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME,
    downtimeHours INT GENERATED ALWAYS AS (TIMESTAMPDIFF(HOUR, startDate, endDate)) STORED,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouseId) REFERENCES warehouses(warehouseId) ON DELETE CASCADE,
    FOREIGN KEY (unitId) REFERENCES storageUnits(unitId) ON DELETE SET NULL
);

-- Tabla de Notificaciones
CREATE TABLE notifications (
    notificationId INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    type ENUM('alert', 'payment', 'maintenance', 'booking') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);

-- Índices adicionales
CREATE INDEX idx_warehouse_status ON warehouses(status);
CREATE INDEX idx_unit_status ON storageUnits(status);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_payment_status ON payments(status);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_notification_read ON notifications(userId, isRead);

-- Vistas
CREATE VIEW v_active_bookings AS
SELECT 
    b.bookingId,
    b.customerId,
    u.name as customerName,
    w.name as warehouseName,
    su.name as unitName,
    b.startDate,
    b.endDate,
    b.status,
    SUM(bu.pricePerHour * TIMESTAMPDIFF(HOUR, b.startDate, b.endDate)) as totalCost
FROM bookings b
JOIN users u ON b.customerId = u.userId
JOIN bookingUnits bu ON b.bookingId = bu.bookingId
JOIN storageUnits su ON bu.unitId = su.unitId
JOIN warehouses w ON su.warehouseId = w.warehouseId
WHERE b.status = 'confirmed' AND b.deletedAt IS NULL
GROUP BY b.bookingId;

CREATE VIEW v_warehouse_occupancy AS
SELECT 
    w.warehouseId,
    w.name as warehouseName,
    COUNT(su.unitId) as totalUnits,
    SUM(CASE WHEN su.status = 'occupied' THEN 1 ELSE 0 END) as occupiedUnits,
    SUM(CASE WHEN su.status = 'available' THEN 1 ELSE 0 END) as availableUnits
FROM warehouses w
LEFT JOIN storageUnits su ON w.warehouseId = su.warehouseId
WHERE w.deletedAt IS NULL
GROUP BY w.warehouseId, w.name;

CREATE VIEW v_unit_capacity AS
SELECT 
    unitId,
    name,
    (width * height * depth) as capacityM3
FROM storageUnits;

-- Procedimientos Almacenados
DELIMITER //

CREATE PROCEDURE sp_create_booking(
    IN p_customerId INT,
    IN p_warehouseId INT,
    IN p_startDate DATETIME,
    IN p_endDate DATETIME,
    IN p_unitIds JSON,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_bookingId INT;
    
    -- Crear reserva
    INSERT INTO bookings (customerId, warehouseId, startDate, endDate, notes)
    VALUES (p_customerId, p_warehouseId, p_startDate, p_endDate, p_notes);
    
    SET v_bookingId = LAST_INSERT_ID();
    
    -- Insertar unidades reservadas
    INSERT INTO bookingUnits (bookingId, unitId, pricePerHour)
    SELECT 
        v_bookingId,
        JSON_EXTRACT(p_unitIds, CONCAT('$[', numbers.n, ']')),
        costPerHour
    FROM storageUnits
    CROSS JOIN (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
    ) numbers
    WHERE JSON_EXTRACT(p_unitIds, CONCAT('$[', numbers.n, ']')) IS NOT NULL;
    
    -- Actualizar estado de unidades
    UPDATE storageUnits
    SET status = 'reserved'
    WHERE unitId IN (SELECT JSON_EXTRACT(p_unitIds, '$[*]'));
    
    SELECT v_bookingId as bookingId;
END //

CREATE PROCEDURE sp_check_temperature_alerts()
BEGIN
    INSERT INTO notifications (userId, type, title, message)
    SELECT 
        w.ownerId,
        'alert',
        'Alerta de Temperatura',
        CONCAT('La unidad ', su.name, ' en ', w.name, ' tiene una temperatura fuera de rango')
    FROM iotSensors s
    JOIN storageUnits su ON s.unitId = su.unitId
    JOIN warehouses w ON su.warehouseId = w.warehouseId
    WHERE s.sensorType = 'temperature'
    AND EXISTS (
        SELECT 1 
        FROM iotReadings r 
        WHERE r.sensorId = s.sensorId 
        AND r.value NOT BETWEEN su.minTemp AND su.maxTemp
        AND r.recordedAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    )
    AND s.status = 'active';
END //

-- Procedimiento para la generación de IDs para iotReadings
CREATE PROCEDURE sp_insert_reading(
    IN p_sensorId INT,
    IN p_value DECIMAL(10,2)
)
BEGIN
    DECLARE v_readingId INT;
    
    -- Obtener el siguiente ID disponible
    SELECT IFNULL(MAX(readingId) + 1, 1) INTO v_readingId FROM iotReadings;
    
    -- Insertar la lectura
    INSERT INTO iotReadings (readingId, sensorId, value)
    VALUES (v_readingId, p_sensorId, p_value);
    
    -- Devolver el ID utilizado
    SELECT v_readingId as readingId;
END //

DELIMITER ;

-- Índices para optimización
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_warehouse_owner ON warehouses(ownerId);
CREATE INDEX idx_unit_warehouse ON storageUnits(warehouseId);
CREATE INDEX idx_booking_customer ON bookings(customerId);
CREATE INDEX idx_booking_warehouse ON bookings(warehouseId);
CREATE INDEX idx_payment_booking ON payments(bookingId);

-- Datos de prueba
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$XgXB8bi4Qi4vRJTK9fM9q.4Xtu4ZJrNe8h4L5pKJxXkXpkHLE4PWi', 'admin'),
('Owner 1', 'owner1@example.com', '$2a$10$XgXB8bi4Qi4vRJTK9fM9q.4Xtu4ZJrNe8h4L5pKJxXkXpkHLE4PWi', 'owner'),
('Customer 1', 'customer1@example.com', '$2a$10$XgXB8bi4Qi4vRJTK9fM9q.4Xtu4ZJrNe8h4L5pKJxXkXpkHLE4PWi', 'customer');

-- Las contraseñas en los datos de prueba son 'password123' hasheadas con bcrypt
