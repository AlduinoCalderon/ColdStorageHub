const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { authMiddleware, checkRole } = require('../../../middleware/auth.middleware');

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: Obtener lista de almacenes
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, maintenance, closed]
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 */
router.get('/', authMiddleware, warehouseController.getAllWarehouses);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     summary: Obtener un almacén por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', authMiddleware, warehouseController.getWarehouseById);

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Crear un nuevo almacén
 *     security:
 *       - bearerAuth: []
 */
router.post('/', 
    authMiddleware, 
    checkRole(['admin', 'owner']), 
    warehouseController.createWarehouse
);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     summary: Actualizar un almacén existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', 
    authMiddleware, 
    checkRole(['admin', 'owner']), 
    warehouseController.updateWarehouse
);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Eliminar un almacén (soft delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', 
    authMiddleware, 
    checkRole(['admin', 'owner']), 
    warehouseController.deleteWarehouse
);

/**
 * @swagger
 * /api/warehouses/nearby:
 *   get:
 *     summary: Buscar almacenes cercanos a una ubicación
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 */
router.get('/search/nearby', authMiddleware, warehouseController.findNearbyWarehouses);

/**
 * @swagger
 * /api/warehouses/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de un almacén
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id/stats', authMiddleware, warehouseController.getWarehouseStats);

module.exports = router; 