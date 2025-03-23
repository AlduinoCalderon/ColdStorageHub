const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración para PlanetScale (MySQL)
const sequelize = new Sequelize(process.env.MYSQL_DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            rejectUnauthorized: true,
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
    }
};

module.exports = {
    sequelize,
    testConnection
}; 