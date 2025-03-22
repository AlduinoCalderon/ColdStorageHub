const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Importar middleware de autenticación
const authMiddleware = require('../middleware/auth.middleware');

// Las siguientes rutas NO necesitan autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);

// A partir de este punto, todas las rutas REQUIEREN autenticación
// Asegúrate de que authMiddleware.authenticate sea una función válida
router.use(authMiddleware.authenticate);

// Rutas que requieren autenticación
router.get('/profile', authController.getProfile);
router.patch('/profile', authController.updateProfile);

// Rutas que requieren ser administrador
router.get('/users', 
  authMiddleware.restrictTo('admin'), 
  authController.getAllUsers
);

router.get('/users/:id', 
  authMiddleware.restrictTo('admin'), 
  authController.getUserById
);

router.patch('/users/:id', 
  authMiddleware.restrictTo('admin'), 
  authController.updateUser
);

router.delete('/users/:id', 
  authMiddleware.restrictTo('admin'), 
  authController.deleteUser
);

module.exports = router;
