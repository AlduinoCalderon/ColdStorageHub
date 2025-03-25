// Datos de prueba para usuarios
const testUsers = [
    {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123',
        role: 'admin',
        phone: '1234567890'
    },
    {
        name: 'María García',
        email: 'maria@example.com',
        password: 'password123',
        role: 'owner',
        phone: '0987654321'
    },
    {
        name: 'Carlos López',
        email: 'carlos@example.com',
        password: 'password123',
        role: 'customer',
        phone: '5555555555'
    }
];

// Datos de prueba para almacenes
const testWarehouses = [
    {
        name: 'Almacén Central',
        address: 'Calle Principal 123',
        lat: 17.0596,
        lng: -96.7237,
        status: 'active',
        ownerId: 2 // ID de María García
    },
    {
        name: 'Almacén Norte',
        address: 'Avenida Norte 456',
        lat: 17.0696,
        lng: -96.7337,
        status: 'active',
        ownerId: 2
    }
];

// Datos de prueba para unidades de almacenamiento
const testStorageUnits = [
    {
        name: 'Unidad A1',
        warehouseId: 1,
        status: 'available',
        costPerHour: 50,
        size: 'small'
    },
    {
        name: 'Unidad B1',
        warehouseId: 1,
        status: 'available',
        costPerHour: 75,
        size: 'medium'
    },
    {
        name: 'Unidad C1',
        warehouseId: 1,
        status: 'available',
        costPerHour: 100,
        size: 'large'
    }
];

// Datos de prueba para reservas
const testBookings = [
    {
        userId: 3, // ID de Carlos López
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
        status: 'pending',
        units: [1, 2] // IDs de las unidades A1 y B1
    }
];

// Datos de prueba para pagos
const testPayments = [
    {
        userId: 3,
        bookingId: 1,
        amount: 21000, // 7 días * (50 + 75) * 24 horas
        status: 'pending',
        paymentMethod: 'credit_card'
    }
];

module.exports = {
    testUsers,
    testWarehouses,
    testStorageUnits,
    testBookings,
    testPayments
};