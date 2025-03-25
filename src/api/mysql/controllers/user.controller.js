// ... existing code ...

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        const user = await User.create(req.body);
        
        // Excluir la contraseña de la respuesta
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse
        });
    } catch (error) {
        console.error('Error detallado al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            details: error.message,
            validationErrors: error.errors?.map(e => ({
                message: e.message,
                field: e.path,
                value: e.value
            }))
        });
    }
};

// ... existing code ...