const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware de CORS
app.use(cors());

// Middleware de compresión
app.use(compression());

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear datos de formularios
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/v1', routes);

// Manejador de errores 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ruta no encontrada'
    });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

module.exports = app; 