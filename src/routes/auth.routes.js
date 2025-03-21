const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.use(authMiddleware.protect);

// Rutas para usuario autenticado
router.get('/profile', authController.getProfile);
router.patch('/profile', authController.updateProfile);

// Rutas solo para admin
router.use(authMiddleware.restrictTo('admin'));

router.get('/users', authController.getAllUsers);
router.get('/users/:id', authController.getUser);
router.patch('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router; 