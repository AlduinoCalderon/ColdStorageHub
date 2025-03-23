const { Model } = require('sequelize');
const mongoose = require('mongoose');

class BaseModel {
    // Métodos comunes para ambas plataformas
    static async safeCreate(data) {
        try {
            return await this.create(data);
        } catch (error) {
            console.error(`Error al crear ${this.name}:`, error);
            throw new Error(`Error al crear ${this.name}: ${error.message}`);
        }
    }

    static async safeFindById(id) {
        try {
            return await this.findByPk ? this.findByPk(id) : this.findById(id);
        } catch (error) {
            console.error(`Error al buscar ${this.name}:`, error);
            throw new Error(`Error al buscar ${this.name}: ${error.message}`);
        }
    }

    static async safeUpdate(id, data) {
        try {
            if (this.prototype instanceof Model) {
                // Sequelize
                const instance = await this.findByPk(id);
                if (!instance) return null;
                return await instance.update(data);
            } else {
                // Mongoose
                return await this.findByIdAndUpdate(id, data, { new: true });
            }
        } catch (error) {
            console.error(`Error al actualizar ${this.name}:`, error);
            throw new Error(`Error al actualizar ${this.name}: ${error.message}`);
        }
    }

    static async safeDelete(id) {
        try {
            if (this.prototype instanceof Model) {
                // Sequelize
                const instance = await this.findByPk(id);
                if (!instance) return false;
                await instance.destroy();
                return true;
            } else {
                // Mongoose
                const result = await this.findByIdAndDelete(id);
                return !!result;
            }
        } catch (error) {
            console.error(`Error al eliminar ${this.name}:`, error);
            throw new Error(`Error al eliminar ${this.name}: ${error.message}`);
        }
    }

    // Métodos de auditoría
    static addAuditFields(schema, options = {}) {
        if (this.prototype instanceof Model) {
            // Sequelize
            return {
                ...schema,
                createdBy: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                updatedBy: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                ...options
            };
        } else {
            // Mongoose
            schema.add({
                createdBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                }
            });
            return schema;
        }
    }

    // Métodos de validación comunes
    static addCommonValidations(schema) {
        if (this.prototype instanceof Model) {
            // Sequelize
            return {
                ...schema,
                validate: {
                    ...schema.validate,
                    async customValidator() {
                        await this.validateCommon();
                    }
                }
            };
        } else {
            // Mongoose
            schema.pre('save', async function(next) {
                await this.validateCommon();
                next();
            });
            return schema;
        }
    }

    // Métodos de búsqueda avanzada
    static async advancedSearch(criteria) {
        try {
            if (this.prototype instanceof Model) {
                // Sequelize
                return await this.findAll({
                    where: criteria,
                    paranoid: !criteria.includeDeleted
                });
            } else {
                // Mongoose
                const query = this.find(criteria.filter);
                if (criteria.sort) query.sort(criteria.sort);
                if (criteria.limit) query.limit(criteria.limit);
                if (criteria.skip) query.skip(criteria.skip);
                return await query.exec();
            }
        } catch (error) {
            console.error(`Error en búsqueda avanzada de ${this.name}:`, error);
            throw new Error(`Error en búsqueda avanzada de ${this.name}: ${error.message}`);
        }
    }

    // Métodos de caché
    static async getWithCache(id, options = {}) {
        // Implementar lógica de caché aquí
        const cacheKey = `${this.name}:${id}`;
        try {
            // Aquí irían las implementaciones con Redis u otro sistema de caché
            return await this.safeFindById(id);
        } catch (error) {
            console.error(`Error al obtener con caché ${this.name}:`, error);
            throw new Error(`Error al obtener con caché ${this.name}: ${error.message}`);
        }
    }

    // Hooks comunes
    static addCommonHooks(schema) {
        if (this.prototype instanceof Model) {
            // Sequelize
            return {
                ...schema,
                hooks: {
                    ...schema.hooks,
                    beforeCreate: async (instance) => {
                        await this.beforeCreateHook(instance);
                    },
                    beforeUpdate: async (instance) => {
                        await this.beforeUpdateHook(instance);
                    }
                }
            };
        } else {
            // Mongoose
            schema.pre('save', async function(next) {
                if (this.isNew) {
                    await this.constructor.beforeCreateHook(this);
                } else {
                    await this.constructor.beforeUpdateHook(this);
                }
                next();
            });
            return schema;
        }
    }
}

module.exports = BaseModel; 