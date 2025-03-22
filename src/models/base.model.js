const { Model, DataTypes } = require('sequelize');

class BaseModel extends Model {
    static init(attributes, options) {
        const baseFields = {
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        };

        return super.init(
            { ...attributes, ...baseFields },
            { 
                ...options,
                paranoid: true,
                underscored: false, // Cambiado a false para usar camelCase
                timestamps: true
            }
        );
    }
}

module.exports = BaseModel;
