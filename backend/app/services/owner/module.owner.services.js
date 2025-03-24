const { Module, Farm, User, Sensor, Measurement, Threshold, sequelize } = require('../../../models');
const SensorService = require("../shared/sensor.shared.service");
const ThresholdService = require("../shared/threshold.shared.service");

class ModuleOwnerService {
    constructor() {
        this.sensorService = new SensorService();
        this.thresholdService = new ThresholdService();
    }

    async create(moduleData) {
        try {
            const {
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                users,
                created_by_user_id
            } = moduleData;

            const newModule = await Module.create({
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                created_by_user_id
            });

            if (users && users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users
                    }
                });
                
                if (foundUsers.length > 0) {
                    await newModule.setUsers(foundUsers);
                }
            }

            const sensors = await this.sensorService.createDefaultSensorsForModule(newModule.id);
            
            for (const sensor of sensors) {
                await this.thresholdService.createDefaultThresholds(sensor.id);
            }

            return await Module.findByPk(newModule.id, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });
        } catch (error) {
            console.error("Error creating module:", error);
            throw error;
        }
    }

    async update(id, moduleData) {
        try {
            const {
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                users
            } = moduleData;

            await Module.update({
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm
            }, {
                where: { id }
            });

            const moduleInstance = await Module.findByPk(id);

            if (users && users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users
                    }
                });
                
                await moduleInstance.setUsers(foundUsers);
            }

            return await Module.findByPk(id, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });
        } catch (error) {
            console.error(`Error updating module with id ${id}:`, error);
            throw error;
        }
    }

    async getById(id) {
        try {
            const module = await Module.findByPk(id, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'email', 'dni'],
                        through: { attributes: [] }
                    },
                    {
                        model: Sensor,
                        as: 'sensors',
                        include: [
                            {
                                model: Threshold,
                                as: 'thresholds'
                            }
                        ]
                    }
                ]
            });

            return module;
        } catch (error) {
            console.error(`Error getting details of module with id: ${id}:`, error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const moduleToDelete = await Module.findByPk(id);

            await this.softDeleteModule(id);
            
            return moduleToDelete;
        } catch (error) {
            console.error(`Error performing soft deletion of module with id ${id}:`, error);
            throw error;
        }
    }

    async softDeleteModule(moduleId) {
        const transaction = await sequelize.transaction();

        try {
            // Fetch all sensors for this module
            // Note: id_module is still valid for sensor-module relationships
            const sensors = await Sensor.findAll({
                where: { id_module: moduleId },
                include: [
                    {
                        model: Measurement,
                        as: 'measurements'
                    },
                    {
                        model: Threshold,
                        as: 'thresholds'
                    }
                ]
            });

            for (const sensor of sensors) {
                for (const measurement of sensor.measurements) {
                    await measurement.destroy({ transaction });
                }

                for (const threshold of sensor.thresholds) {
                    await threshold.destroy({ transaction });
                }

                await sensor.destroy({ transaction });
            }

            await Module.destroy({
                where: { id: moduleId },
                transaction
            });

            await transaction.commit();
            console.log(`Módule ${moduleId} and their relationships successfully eliminated (soft delete)`);
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error(`Error performing soft delete of module: ${moduleId}:`, error);
            throw new Error(`Error deleting module: ${error.message}`);
        }
    }
}

module.exports = ModuleOwnerService;