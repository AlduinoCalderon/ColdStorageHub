// Actualizar el archivo: src/api/mysql/routes/storage-unit.routes.js

const express = require('express');
const router = express.Router();
const storageUnitController = require('../controllers/storage-unit.controller');

// Rutas para unidades de almacenamiento
router.get('/', storageUnitController.getAllStorageUnits);
router.get('/stats/:warehouseId', storageUnitController.getStorageUnitStats);
router.get('/wh/:id', storageUnitController.getStorageUnitsByWarehouseId); // Nueva ruta
router.get('/:id', storageUnitController.getStorageUnitById);
router.post('/', storageUnitController.createStorageUnit);
router.put('/:id', storageUnitController.updateStorageUnit);
router.delete('/:id', storageUnitController.deleteStorageUnit);

module.exports = router;