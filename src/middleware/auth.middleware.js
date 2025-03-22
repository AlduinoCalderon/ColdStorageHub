const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'User account is not active' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

const ownerMiddleware = async (req, res, next) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner role required.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const customerMiddleware = async (req, res, next) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Access denied. Customer role required.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    authMiddleware,
    ownerMiddleware,
    adminMiddleware,
    customerMiddleware
};
