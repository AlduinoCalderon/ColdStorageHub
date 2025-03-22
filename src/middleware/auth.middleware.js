const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { User } = require('../models');
const config = require('../config/index');

// Middleware para verificar que el usuario está autenticado
exports.authenticate = async (req, res, next) => {
  try {
    // 1) Obtener el token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No estás autenticado. Por favor inicia sesión para obtener acceso.'
      });
    }

    // 2) Verificar el token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Verificar si el usuario todavía existe
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'El usuario al que pertenece este token ya no existe.'
      });
    }

    // 4) Guardar el usuario en req para uso posterior
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(401).json({
      status: 'error',
      message: 'No estás autenticado. Por favor inicia sesión para obtener acceso.'
    });
  }
};

// Middleware para restringir el acceso según el rol del usuario
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para realizar esta acción.'
      });
    }
    next();
  };
};
