const axios = require('axios');
const { testUsers, testWarehouses, testStorageUnits, testBookings, testPayments } = require('./test-data');

const API_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

async function insertTestData() {
    try {
        console.log('Iniciando inserción de datos de prueba...');

        // Insertar usuarios
        console.log('\nInsertando usuarios...');
        for (const user of testUsers) {
            const response = await axios.post(`${API_URL}/users`, user);
            console.log(`Usuario creado: ${response.data.data.name}`);
        }

        // Insertar almacenes
        console.log('\nInsertando almacenes...');
        for (const warehouse of testWarehouses) {
            const response = await axios.post(`${API_URL}/warehouses`, warehouse);
            console.log(`Almacén creado: ${response.data.data.name}`);
        }

        // Insertar unidades de almacenamiento
        console.log('\nInsertando unidades de almacenamiento...');
        for (const unit of testStorageUnits) {
            const response = await axios.post(`${API_URL}/storage-units`, unit);
            console.log(`Unidad creada: ${response.data.data.name}`);
        }

        // Insertar reservas
        console.log('\nInsertando reservas...');
        for (const booking of testBookings) {
            const response = await axios.post(`${API_URL}/bookings`, booking);
            console.log(`Reserva creada: ID ${response.data.data.bookingId}`);
        }

        // Insertar pagos
        console.log('\nInsertando pagos...');
        for (const payment of testPayments) {
            const response = await axios.post(`${API_URL}/payments`, payment);
            console.log(`Pago creado: ID ${response.data.data.paymentId}`);
        }

        console.log('\n¡Datos de prueba insertados exitosamente!');
    } catch (error) {
        console.error('Error al insertar datos de prueba:', error.response?.data || error.message);
    }
}

// Ejecutar el script
insertTestData();