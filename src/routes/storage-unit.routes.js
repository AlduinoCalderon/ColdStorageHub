const express = require('express');
const router = express.Router();
const storageUnitController = require('../controllers/storage-unit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { StorageUnit } = require('../models');

// Rutas públicas
router.get('/', storageUnitController.getAllStorageUnits);
router.get('/:id', storageUnitController.getStorageUnit);

// Rutas protegidas
router.use(authMiddleware.protect);

// Rutas para propietarios y admin
router.post('/',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    storageUnitController.createStorageUnit
);

router.patch('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(StorageUnit),
    storageUnitController.updateStorageUnit
);

router.delete('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(StorageUnit),
    storageUnitController.deleteStorageUnit
);

module.exports = router; 