const { Model, DataTypes } = require('sequelize');

class BaseModel extends Model {
    static init(attributes, options) {
        const baseFields = {
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        };

        return super.init(
            { ...attributes, ...baseFields },
            { 
                ...options,
                paranoid: true,
                underscored: true
            }
        );
    }
}

module.exports = BaseModel; 