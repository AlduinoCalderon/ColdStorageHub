const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, business_name } = req.body;

        // Verificar si el email ya existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'El email ya está registrado'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            business_name
        });

        // Generar token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Remover contraseña de la respuesta
        user.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al registrar el usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login de usuario
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Remover contraseña de la respuesta
        user.password = undefined;

        res.json({
            status: 'success',
            token,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al iniciar sesión',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener perfil del usuario actual
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el perfil',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar perfil del usuario
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, business_name, current_password, new_password } = req.body;

        const user = await User.findByPk(req.user.id);

        // Verificar contraseña actual si se quiere cambiar la contraseña
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Debe proporcionar la contraseña actual'
                });
            }

            const isPasswordValid = await bcrypt.compare(current_password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Encriptar nueva contraseña
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(new_password, salt);
        }

        // Actualizar otros campos
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (business_name) user.business_name = business_name;

        await user.save();

        // Remover contraseña de la respuesta
        user.password = undefined;

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el perfil',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los usuarios (solo admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });

        res.json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un usuario específico (solo admin)
exports.getUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar un usuario (solo admin)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, phone, business_name, status } = req.body;
        
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        // Actualizar campos
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (phone) user.phone = phone;
        if (business_name) user.business_name = business_name;
        if (status) user.status = status;

        await user.save();

        // Remover contraseña de la respuesta
        user.password = undefined;

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar un usuario (solo admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        await user.destroy();

        res.json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 