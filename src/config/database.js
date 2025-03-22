const Sequelize = require('sequelize');
const config = require('./index').database;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'mysql',
    logging: config.logging,
    pool: config.pool
  }
);

// Probar la conexión
sequelize
  .authenticate()
  .then(() => {
    console.log('Conexión a la base de datos MySQL establecida con éxito.');
  })
  .catch(err => {
    console.error('No se pudo conectar a la base de datos MySQL:', err);
    console.error('Detalles de configuración:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      // No mostramos la contraseña por seguridad
    });
  });

module.exports = sequelize;
