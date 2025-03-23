const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');

// Rutas para almacenes
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router; 