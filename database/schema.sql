-- Tabla de Propietarios
CREATE TABLE Owners (
    owner_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL
);

-- Tabla de Almacenes
CREATE TABLE Warehouses (
    warehouse_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active',
    location POINT NOT NULL,
    address VARCHAR(255) NOT NULL,
    operating_hours JSON,
    amenities JSON,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL,
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
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

-- Tabla de Usuarios Finales
CREATE TABLE EndUsers (
    end_user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL
);

-- Tabla de Reservas
CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    end_user_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    notes TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL,
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

-- Tabla de Sensores IoT
CREATE TABLE IoT_Sensors (
    sensor_id INT PRIMARY KEY AUTO_INCREMENT,
    unit_id INT NOT NULL,
    sensor_type ENUM('temperature', 'humidity', 'motion') NOT NULL,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME NULL DEFAULT NULL,
    FOREIGN KEY (unit_id) REFERENCES StorageUnits(unit_id) ON DELETE CASCADE
);

-- Tabla de Lecturas IoT
CREATE TABLE IoT_Readings (
    reading_id INT PRIMARY KEY AUTO_INCREMENT,
    sensor_id INT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES IoT_Sensors(sensor_id) ON DELETE CASCADE
);

-- Índices adicionales
CREATE INDEX idx_recorded_at ON IoT_Readings(recorded_at);
