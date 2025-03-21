const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { Warehouse } = require('../models');

// Rutas públicas
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouse);
router.get('/nearby', warehouseController.findNearbyWarehouses);

// Rutas protegidas
router.use(authMiddleware.protect);

// Rutas para propietarios y admin
router.post('/', 
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    warehouseController.createWarehouse
);

router.patch('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(Warehouse),
    warehouseController.updateWarehouse
);

router.delete('/:id',
    authMiddleware.restrictTo('warehouse_owner', 'admin'),
    authMiddleware.checkOwnership(Warehouse),
    warehouseController.deleteWarehouse
);

module.exports = router; 