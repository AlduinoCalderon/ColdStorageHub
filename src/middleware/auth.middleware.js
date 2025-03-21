const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Warehouse = require('../models/warehouse.model');

// Verificar token JWT
exports.protect = async (req, res, next) => {
    try {
        // Obtener token del header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No está autorizado para acceder a esta ruta'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener usuario
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'El usuario ya no existe'
            });
        }

        // Verificar si el usuario está activo
        if (user.status !== 'active') {
            return res.status(401).json({
                status: 'error',
                message: 'El usuario está inactivo'
            });
        }

        // Agregar usuario a la solicitud
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Token inválido'
        });
    }
};

// Restringir acceso a roles específicos
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para realizar esta acción'
            });
        }
        next();
    };
};

// Verificar si el usuario es el propietario del recurso
exports.checkOwnership = (model, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const resource = await model.findByPk(req.params[paramName], {
                include: [{
                    model: Warehouse,
                    as: 'warehouse'
                }]
            });

            if (!resource) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Recurso no encontrado'
                });
            }

            // Verificar si el usuario es el propietario o admin
            if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'No tiene permiso para realizar esta acción'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error al verificar propiedad',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

// Verificar si el usuario es el propietario del almacén
exports.checkWarehouseOwnership = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findByPk(req.params.warehouse_id);
        
        if (!warehouse) {
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        if (warehouse.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para realizar esta acción'
            });
        }

        req.warehouse = warehouse;
        next();
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al verificar propiedad del almacén',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 