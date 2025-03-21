require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Sincronizar la base de datos sin modificar la estructura
        await sequelize.sync();
        console.log('Base de datos sincronizada correctamente');

        // Iniciar el servidor
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Ambiente: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejar señales de terminación
process.on('SIGTERM', () => {
    console.log('Señal SIGTERM recibida. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Señal SIGINT recibida. Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer(); 