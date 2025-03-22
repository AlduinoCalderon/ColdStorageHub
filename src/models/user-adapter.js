/**
 * Adaptador para el modelo de Usuario
 * Este archivo proporciona funciones auxiliares para interactuar con el modelo de Usuario
 */

// Función para adaptar el objeto de usuario para respuestas API
exports.sanitizeUser = (user) => {
  if (!user) return null;
  
  // Convertir a objeto JavaScript plano si es un modelo Sequelize
  const userData = user.toJSON ? user.toJSON() : { ...user };
  
  // Eliminar la contraseña y otros campos sensibles antes de enviar al cliente
  delete userData.password;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpires;
  
  return userData;
};

// Función para validar datos de usuario
exports.validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.email) {
    errors.push('El email es requerido');
  } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push('El formato del email no es válido');
  }
  
  if (!userData.password && userData.id === undefined) {
    errors.push('La contraseña es requerida');
  } else if (userData.password && userData.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  if (!userData.name) {
    errors.push('El nombre es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para formatear errores relacionados con usuarios
exports.formatUserError = (error) => {
  // Para errores de validación de Sequelize
  if (error.name === 'SequelizeValidationError') {
    return {
      status: 'error',
      message: 'Error de validación',
      errors: error.errors.map(e => e.message)
    };
  }
  
  // Para errores de unicidad (por ejemplo, email duplicado)
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      status: 'error',
      message: 'Ya existe un usuario con ese email',
      errors: ['El email ya está en uso']
    };
  }
  
  // Otros errores
  return {
    status: 'error',
    message: 'Error al procesar la solicitud de usuario',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
};
