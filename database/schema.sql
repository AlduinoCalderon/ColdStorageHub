-- Eliminación de tablas existentes
DROP TABLE IF EXISTS IoT_Stats, IoT_Readings, IoT_Sensors, Maintenances, Payments, Booking_StorageUnits, Bookings, EndUsers, StorageUnits, Warehouses, Owners;

-- Tabla de Propietarios
CREATE TABLE Owners (
    owner_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL -- Borrado lógico
);

-- Tabla de Almacenes
CREATE TABLE Warehouses (
    warehouse_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active',
    location POINT NOT NULL, -- Ubicación geoespacial
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Borrado lógico
    operating_hours JSON,
    amenities JSON,
    FOREIGN KEY (owner_id) REFERENCES Owners(owner_id) ON DELETE CASCADE
);

-- Índice geoespacial para búsquedas por ubicación
CREATE SPATIAL INDEX idx_location ON Warehouses(location);

-- Tabla de Unidades de Almacenamiento
CREATE TABLE StorageUnits (
    unit_id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id INT NOT NULL,
    width DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    depth DECIMAL(5,2) NOT NULL,
    capacity_m3 DECIMAL(10,2) NOT NULL,
    cost_per_hour DECIMAL(10,2) NOT NULL,
    temp_range VARCHAR(50) NOT NULL,
    humidity_range VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Borrado lógico
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

-- Tabla de Usuarios Finales
CREATE TABLE EndUsers (
    end_user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL -- Borrado lógico
);

-- Tabla de Reservas
CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    end_user_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Borrado lógico
    CONSTRAINT chk_booking_dates CHECK (start_date < end_date),
    FOREIGN KEY (end_user_id) REFERENCES EndUsers(end_user_id) ON DELETE CASCADE
);

-- Tabla de relación entre Reservas y Unidades de Almacenamiento
CREATE TABLE Booking_StorageUnits (
    booking_id INT NOT NULL,
    unit_id INT NOT NULL,
    PRIMARY KEY (booking_id, unit_id),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES StorageUnits(unit_id) ON DELETE CASCADE
);

-- Tabla de Pagos
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL UNIQUE, -- Un pago por reserva
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE
);

-- Tabla de Mantenimientos
CREATE TABLE Maintenances (
    maintenance_id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    diagnosis TEXT,
    duration_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Borrado lógico
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

-- Tabla de Sensores IoT
CREATE TABLE IoT_Sensors (
    sensor_id INT PRIMARY KEY AUTO_INCREMENT,
    unit_id INT NOT NULL,
    sensor_type ENUM('temperature', 'humidity', 'motion') NOT NULL,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Borrado lógico
    FOREIGN KEY (unit_id) REFERENCES StorageUnits(unit_id) ON DELETE CASCADE
);

-- Tabla de Lecturas IoT
CREATE TABLE IoT_Readings (
    reading_id INT PRIMARY KEY AUTO_INCREMENT,
    sensor_id INT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES IoT_Sensors(sensor_id) ON DELETE CASCADE
);

-- Tabla de Estadísticas IoT
CREATE TABLE IoT_Stats (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id INT NOT NULL,
    pressure DECIMAL(10,2),  
    temperature DECIMAL(10,2),
    energy_consumption DECIMAL(10,2),
    humidity DECIMAL(10,2),
    anomaly_detected BOOLEAN DEFAULT FALSE, -- Para análisis de fallos
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

-- Índice para búsquedas por fecha en estadísticas
CREATE INDEX idx_recorded_at ON IoT_Stats(recorded_at);


-- Crear una vista para obtener los valores actuales
CREATE VIEW Current_Unit_Readings AS
SELECT 
    su.unit_id,
    su.warehouse_id,
    MAX(CASE WHEN s.sensor_type = 'temperature' THEN r.value END) as current_temperature,
    MAX(CASE WHEN s.sensor_type = 'humidity' THEN r.value END) as current_humidity
FROM StorageUnits su
LEFT JOIN IoT_Sensors s ON su.unit_id = s.unit_id
LEFT JOIN IoT_Readings r ON s.sensor_id = r.sensor_id
WHERE r.recorded_at = (
    SELECT MAX(recorded_at)
    FROM IoT_Readings
)
GROUP BY su.unit_id, su.warehouse_id;

-- O crear un procedimiento almacenado para obtener los valores actuales
DELIMITER //
CREATE PROCEDURE Get_Unit_Current_Readings(IN p_unit_id INT)
BEGIN
    SELECT 
        su.unit_id,
        MAX(CASE WHEN s.sensor_type = 'temperature' THEN r.value END) as current_temperature,
        MAX(CASE WHEN s.sensor_type = 'humidity' THEN r.value END) as current_humidity,
        MAX(r.recorded_at) as last_reading_time
    FROM StorageUnits su
    LEFT JOIN IoT_Sensors s ON su.unit_id = s.unit_id
    LEFT JOIN IoT_Readings r ON s.sensor_id = r.sensor_id
    WHERE su.unit_id = p_unit_id
    GROUP BY su.unit_id;
END //
DELIMITER ;

-- Procedimiento simplificado para obtener almacenes cercanos
CREATE PROCEDURE Find_Nearby_Warehouses_Initial(
    IN p_latitude DECIMAL(10,8),
    IN p_longitude DECIMAL(10,8),
    IN p_max_distance DECIMAL(10,2),
    IN p_required_capacity DECIMAL(10,2),
    IN p_start_date DATETIME,
    IN p_end_date DATETIME
)
BEGIN
    SELECT 
        w.warehouse_id,
        w.address,
        w.status,
        ST_X(w.location) as latitude,
        ST_Y(w.location) as longitude,
        COUNT(DISTINCT su.unit_id) as available_units,
        MIN(su.capacity_m3) as min_capacity,
        MAX(su.capacity_m3) as max_capacity,
        MIN(su.cost_per_hour) as min_price_per_hour
    FROM Warehouses w
    JOIN StorageUnits su ON w.warehouse_id = su.warehouse_id
    WHERE w.deleted_at IS NULL
    AND w.status = 'active'
    AND su.deleted_at IS NULL
    AND su.capacity_m3 >= p_required_capacity
    AND ST_Distance_Sphere(
        point(p_longitude, p_latitude),
        w.location
    ) <= p_max_distance * 1000 -- Convertir km a metros
    AND NOT EXISTS (
        SELECT 1 
        FROM Booking_StorageUnits bsu
        JOIN Bookings b ON bsu.booking_id = b.booking_id
        WHERE bsu.unit_id = su.unit_id
        AND b.deleted_at IS NULL
        AND (
            (p_start_date BETWEEN b.start_date AND b.end_date)
            OR (p_end_date BETWEEN b.start_date AND b.end_date)
        )
    )
    GROUP BY w.warehouse_id, w.address, w.status, w.location
    LIMIT 20; -- Limitar resultados iniciales
END; 