const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Datos de prueba
const testData = {
    // 1. Usuario admin (sin dependencias)
    user: {
        name: 'Juan Perez',  // Quitamos el acento para evitar problemas de codificación
        email: 'juan@example.com',
        password: 'password123',
        role: 'admin',
        phone: '1234567890'
    }
};

async function insertUser() {
    try {
        console.log('Insertando usuario admin...');
        console.log('Datos a enviar:', JSON.stringify(testData.user, null, 2));
        
        const response = await axios.post(`${API_URL}/users`, testData.user, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\nUsuario creado exitosamente:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('\nError al insertar usuario:');
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
            console.error('Estado HTTP:', error.response.status);
        } else if (error.request) {
            console.error('No se recibió respuesta del servidor');
        } else {
            console.error('Error al hacer la petición:', error.message);
        }
    }
}

// Ejecutar el script
insertUser();