const { Sequelize } = require('sequelize');
const config = require('./config'); // Asumiendo que hay un archivo de configuración

// Configuración de Sequelize para manejar correctamente los tipos espaciales
const sequelize = new Sequelize(
    config.database.name,
    config.database.username,
    config.database.password,
    {
        host: config.database.host,
        dialect: 'mysql',
        port: config.database.port,
        logging: config.database.logging || false,
        dialectOptions: {
            // Soporte para consultas espaciales
            supportBigNumbers: true,
            bigNumberStrings: true
        },
        define: {
            // Usar camelCase para nombres de columnas (coincidiendo con schema.sql)
            underscored: false,
            // Soporte para soft delete
            paranoid: true,
            // Evitar que Sequelize pluralice los nombres de las tablas
            freezeTableName: false
        }
    }
);

// Función para probar la conexión y sincronizar modelos si es necesario
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');
        
        // Sincronización de modelos (solo en desarrollo)
        if (process.env.NODE_ENV === 'development' && config.database.sync) {
            await sequelize.sync({ alter: config.database.syncAlter || false });
            console.log('Modelos sincronizados correctamente.');
        }
        
        return true;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        return false;
    }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
