const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración para MySQL
const sequelize = new Sequelize(process.env.MYSQL_DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        // Asegurar que las fechas se manejen correctamente
        dateStrings: true,
        typeCast: true
    },
    define: {
        // Desactivar la modificación automática de nombres de tablas/columnas
        freezeTableName: true,
        // Mantener los nombres de columnas exactamente como están en la base de datos
        underscored: false,
        // No agregar timestamps automáticamente
        timestamps: false
    },
    // No sincronizar automáticamente los modelos con la base de datos
    sync: false,
    // Logging solo en desarrollo
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Configuración de pool de conexiones
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to MySQL database:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection
}; 