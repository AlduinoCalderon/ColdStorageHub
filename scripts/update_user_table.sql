-- Agregar campo status a la tabla users
ALTER TABLE users
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER role;

-- Actualizar usuarios existentes a activos
UPDATE users SET status = 'active' WHERE status IS NULL; 