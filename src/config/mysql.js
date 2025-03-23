const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración para Clever Cloud (MySQL)
const sequelize = new Sequelize(process.env.MYSQL_DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Permitir certificados auto-firmados en desarrollo
        },
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to MySQL database:', error);
        throw error; // Propagar el error para mejor manejo
    }
};

module.exports = {
    sequelize,
    testConnection
}; 