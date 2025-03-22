const Booking = require('../models/booking.model');
const BookingUnit = require('../models/booking-unit.model');
const StorageUnit = require('../models/storage-unit.model');
const Warehouse = require('../models/warehouse.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Crear una nueva reserva
exports.createBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { warehouseId, unitIds, startDate, endDate, notes } = req.body;
        const customerId = req.user.userId;

        // Verificar si el almacén existe
        const warehouse = await Warehouse.findByPk(warehouseId);
        if (!warehouse) {
            await transaction.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Almacén no encontrado'
            });
        }

        // Verificar si las unidades existen y están disponibles
        const storageUnits = await StorageUnit.findAll({
            where: {
                unitId: { [Op.in]: unitIds },
                warehouseId,
                status: 'available'
            }
        });

        if (storageUnits.length !== unitIds.length) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Una o más unidades no están disponibles o no pertenecen al almacén especificado'
            });
        }

        // Verificar si hay conflictos de horario
        const existingBookings = await Booking.findAll({
            where: {
                status: {
                    [Op.in]: ['pending', 'confirmed']
                },
                [Op.or]: [
                    {
                        startDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        endDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } }
                        ]
                    }
                ]
            },
            include: [{
                model: StorageUnit,
                as: 'storageUnits',
                where: {
                    unitId: { [Op.in]: unitIds }
                }
            }]
        });

        if (existingBookings.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Ya existe una reserva para alguna de estas unidades en el período seleccionado'
            });
        }

        // Crear la reserva
        const booking = await Booking.create({
            customerId,
            warehouseId,
            startDate,
            endDate,
            notes,
            status: 'pending'
        }, { transaction });

        // Asociar las unidades a la reserva
        for (const unit of storageUnits) {
            await BookingUnit.create({
                bookingId: booking.bookingId,
                unitId: unit.unitId,
                pricePerHour: unit.costPerHour
            }, { transaction });

            // Actualizar el estado de la unidad
            await unit.update({ status: 'reserved' }, { transaction });
        }

        await transaction.commit();

        // Obtener la reserva completa con sus relaciones
        const completeBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        res.status(201).json({
            status: 'success',
            data: { booking: completeBooking }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todas las reservas
exports.getAllBookings = async (req, res) => {
    try {
        const filters = {};
        const { status, startDate, endDate, warehouseId } = req.query;
        
        // Aplicar filtros si se proporcionan
        if (status) filters.status = status;
        if (warehouseId) filters.warehouseId = warehouseId;
        
        // Filtro de fechas
        if (startDate || endDate) {
            filters[Op.and] = [];
            
            if (startDate) {
                filters[Op.and].push({ startDate: { [Op.gte]: startDate } });
            }
            
            if (endDate) {
                filters[Op.and].push({ endDate: { [Op.lte]: endDate } });
            }
        }
        
        // Aplicar filtros según el rol del usuario
        if (req.user.role === 'customer') {
            filters.customerId = req.user.userId;
        } else if (req.user.role === 'owner') {
            // Obtener los almacenes del propietario
            const warehouses = await Warehouse.findAll({
                where: { ownerId: req.user.userId },
                attributes: ['warehouseId']
            });
            
            const warehouseIds = warehouses.map(w => w.warehouseId);
            filters.warehouseId = { [Op.in]: warehouseIds };
        }
        // Los administradores pueden ver todas las reservas, por lo que no necesitan filtros adicionales

        const bookings = await Booking.findAll({
            where: filters,
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            status: 'success',
            results: bookings.length,
            data: { bookings }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las reservas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una reserva específica
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar si el usuario tiene permiso para ver esta reserva
        const isOwner = booking.customerId === req.user.userId;
        const isWarehouseOwner = await Warehouse.findOne({
            where: {
                warehouseId: booking.warehouseId,
                ownerId: req.user.userId
            }
        });
        
        if (!isOwner && !isWarehouseOwner && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para ver esta reserva'
            });
        }

        res.json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar una reserva
exports.updateBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { startDate, endDate, notes, status } = req.body;
        
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: StorageUnit,
                    as: 'storageUnits'
                },
                {
                    model: Warehouse,
                    as: 'warehouse'
                }
            ]
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar permisos según el rol
        const isCustomer = booking.customerId === req.user.userId;
        const isWarehouseOwner = booking.warehouse.ownerId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        if (!isCustomer && !isWarehouseOwner && !isAdmin) {
            await transaction.rollback();
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para actualizar esta reserva'
            });
        }
        
        // Restricciones según el rol
        if (isCustomer && !['pending', 'confirmed'].includes(booking.status)) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'No puede modificar una reserva que no está pendiente o confirmada'
            });
        }
        
        // Los clientes solo pueden modificar la fecha y notas, no el estado
        if (isCustomer && status) {
            await transaction.rollback();
            return res.status(403).json({
                status: 'error',
                message: 'Los clientes no pueden cambiar el estado de la reserva directamente'
            });
        }

        // Si se actualiza el horario, verificar conflictos
        if (startDate || endDate) {
            const newStartDate = startDate || booking.startDate;
            const newEndDate = endDate || booking.endDate;
            
            // Verificar que la fecha de inicio sea menor que la de fin
            if (new Date(newStartDate) >= new Date(newEndDate)) {
                await transaction.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'La fecha de inicio debe ser anterior a la fecha de fin'
                });
            }

            // Obtener los IDs de las unidades de esta reserva
            const unitIds = booking.storageUnits.map(unit => unit.unitId);
            
            // Buscar conflictos de reserva
            const existingBookings = await Booking.findAll({
                where: {
                    bookingId: { [Op.ne]: booking.bookingId },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    },
                    [Op.or]: [
                        {
                            startDate: {
                                [Op.between]: [newStartDate, newEndDate]
                            }
                        },
                        {
                            endDate: {
                                [Op.between]: [newStartDate, newEndDate]
                            }
                        },
                        {
                            [Op.and]: [
                                { startDate: { [Op.lte]: newStartDate } },
                                { endDate: { [Op.gte]: newEndDate } }
                            ]
                        }
                    ]
                },
                include: [{
                    model: StorageUnit,
                    as: 'storageUnits',
                    where: {
                        unitId: { [Op.in]: unitIds }
                    }
                }]
            });

            if (existingBookings.length > 0) {
                await transaction.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Ya existe una reserva para alguna de estas unidades en el período seleccionado'
                });
            }
        }

        // Actualizar campos
        const updatedFields = {};
        if (startDate) updatedFields.startDate = startDate;
        if (endDate) updatedFields.endDate = endDate;
        if (notes) updatedFields.notes = notes;
        if (status && (isWarehouseOwner || isAdmin)) updatedFields.status = status;

        await booking.update(updatedFields, { transaction });
        
        // Si se cambia el estado a "cancelled" o "completed", liberar las unidades
        if (updatedFields.status === 'cancelled' || updatedFields.status === 'completed') {
            for (const unit of booking.storageUnits) {
                await unit.update({ status: 'available' }, { transaction });
            }
        }
        
        await transaction.commit();

        // Obtener la reserva actualizada con todas sus relaciones
        const updatedBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        res.json({
            status: 'success',
            data: { booking: updatedBooking }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cancelar una reserva
exports.cancelBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: StorageUnit,
                    as: 'storageUnits'
                },
                {
                    model: Warehouse,
                    as: 'warehouse'
                }
            ]
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar permisos según el rol
        const isCustomer = booking.customerId === req.user.userId;
        const isWarehouseOwner = booking.warehouse.ownerId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        if (!isCustomer && !isWarehouseOwner && !isAdmin) {
            await transaction.rollback();
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para cancelar esta reserva'
            });
        }

        // Solo se pueden cancelar reservas pendientes o confirmadas
        if (!['pending', 'confirmed'].includes(booking.status)) {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'No se puede cancelar una reserva que no está pendiente o confirmada'
            });
        }

        // Actualizar estado a cancelado
        await booking.update({ status: 'cancelled' }, { transaction });
        
        // Liberar las unidades de almacenamiento
        for (const unit of booking.storageUnits) {
            await unit.update({ status: 'available' }, { transaction });
        }
        
        await transaction.commit();

        // Obtener la reserva actualizada
        const updatedBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        res.json({
            status: 'success',
            data: { booking: updatedBooking }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: 'error',
            message: 'Error al cancelar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Confirmar una reserva (solo para propietarios de almacenes y administradores)
exports.confirmBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: StorageUnit,
                    as: 'storageUnits'
                },
                {
                    model: Warehouse,
                    as: 'warehouse'
                }
            ]
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar permisos
        const isWarehouseOwner = booking.warehouse.ownerId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        if (!isWarehouseOwner && !isAdmin) {
            await transaction.rollback();
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para confirmar esta reserva'
            });
        }

        // Solo se pueden confirmar reservas pendientes
        if (booking.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'No se puede confirmar una reserva que no está pendiente'
            });
        }

        // Actualizar estado a confirmado
        await booking.update({ status: 'confirmed' }, { transaction });
        
        // Actualizar estado de las unidades a ocupadas
        for (const unit of booking.storageUnits) {
            await unit.update({ status: 'occupied' }, { transaction });
        }
        
        await transaction.commit();

        // Obtener la reserva actualizada
        const updatedBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        res.json({
            status: 'success',
            data: { booking: updatedBooking }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: 'error',
            message: 'Error al confirmar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Completar una reserva (solo para propietarios de almacenes y administradores)
exports.completeBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: StorageUnit,
                    as: 'storageUnits'
                },
                {
                    model: Warehouse,
                    as: 'warehouse'
                }
            ]
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Reserva no encontrada'
            });
        }

        // Verificar permisos
        const isWarehouseOwner = booking.warehouse.ownerId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        if (!isWarehouseOwner && !isAdmin) {
            await transaction.rollback();
            return res.status(403).json({
                status: 'error',
                message: 'No tiene permiso para completar esta reserva'
            });
        }

        // Solo se pueden completar reservas confirmadas
        if (booking.status !== 'confirmed') {
            await transaction.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'No se puede completar una reserva que no está confirmada'
            });
        }

        // Actualizar estado a completado
        await booking.update({ status: 'completed' }, { transaction });
        
        // Liberar las unidades de almacenamiento
        for (const unit of booking.storageUnits) {
            await unit.update({ status: 'available' }, { transaction });
        }
        
        await transaction.commit();

        // Obtener la reserva actualizada
        const updatedBooking = await Booking.findByPk(booking.bookingId, {
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['userId', 'name', 'email']
                },
                {
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouseId', 'name', 'address']
                },
                {
                    model: StorageUnit,
                    as: 'storageUnits',
                    attributes: ['unitId', 'name', 'width', 'height', 'depth'],
                    through: { attributes: ['pricePerHour'] }
                }
            ]
        });

        res.json({
            status: 'success',
            data: { booking: updatedBooking }
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: 'error',
            message: 'Error al completar la reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
