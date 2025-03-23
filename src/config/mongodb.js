const mongoose = require('mongoose');
require('dotenv').config();

// Configuración para MongoDB Atlas
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to MongoDB:', error);
        process.exit(1);
    }
};

// Eventos de conexión
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

module.exports = {
    connectDB,
    connection: mongoose.connection
}; 