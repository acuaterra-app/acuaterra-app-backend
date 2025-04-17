const { Module, Farm, User, Sensor, Measurement, Threshold, ModuleUser, sequelize } = require('../../../models');
const SensorService = require("../shared/sensor.shared.service");
const ThresholdService = require("../shared/threshold.shared.service");
const Mailer = require("../../utils/Mailer");
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const bcrypt = require('bcrypt');
const { ROLES } = require('../../enums/roles.enum');
const { Op } = require('sequelize');
const { v1 } = require('uuid');

const TRANSACTION_TIMEOUT = 30000; // 30 seconds

class ModuleOwnerService {
    constructor() {
        this.sensorService = new SensorService();
        this.thresholdService = new ThresholdService();
        this.mailer = new Mailer;
    }

    generateSensorCredentials(moduleName) {
        const uuid = v1();
        const email = uuid + `-module@acuaterra.tech`;
        const tempPassword = crypto.randomBytes(6).toString('hex');
        return { email, tempPassword };
    }

    async sendSensorCredentialsEmail(ownerEmail, sensorEmail, tempPassword, moduleName) {
        try {
            if (!ownerEmail) {
                return { success: false, error: 'Missing owner email address' };
            }

            if (!sensorEmail || !tempPassword) {
                return { success: false, error: 'Missing sensor credentials' };
            }

            const subject = `Credenciales del Sensor para el Módulo ${moduleName}`;

            const htmlContent = await ejs.renderFile(
                path.join(__dirname, '../../views/emails/new_sensor.ejs'),
                {
                    moduleName,
                    sensorEmail,
                    tempPassword
                }
            );

            const result = await this.mailer.sendEmail(
                ownerEmail,
                subject,
                htmlContent,
                process.env.RESEND_FROM_EMAIL
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error(`Error sending sensor credentials email for module ${moduleName}:`, error);
            return {
                success: false,
                error: `Error sending sensor credentials email: ${error.message}`
            };
        }
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

            let newModule, sensorUser, sensorEmail, tempPassword;
            const moduleTransaction = await sequelize.transaction({
                timeout: TRANSACTION_TIMEOUT
            });

            try {
                const [moduleCreated, credentials] = await Promise.all([
                    Module.create({
                        name,
                        location,
                        latitude,
                        longitude,
                        species_fish,
                        fish_quantity,
                        fish_age,
                        dimensions,
                        id_farm,
                        created_by_user_id,
                        isActive: true
                    }, { transaction: moduleTransaction }),

                    Promise.resolve(this.generateSensorCredentials(name))
                ]);

                newModule = moduleCreated;
                sensorEmail = credentials.email;
                tempPassword = credentials.tempPassword;

                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                sensorUser = await User.create({
                    email: sensorEmail,
                    password: hashedPassword,
                    id_rol: ROLES.MODULE,
                    name: `Sensor ${name}`,
                    status: 'active',
                    dni: 'SENSOR-' + Date.now(),
                    contact: JSON.stringify({
                        type: 'sensor',
                        moduleId: newModule.id
                    }),
                    address: `${location} (${latitude}, ${longitude})`,
                    isActive: true
                }, { transaction: moduleTransaction });

                if (users && users.length > 0) {
                    const foundUsers = await User.findAll({
                        where: { 
                            id: { [Op.in]: users },
                            isActive: true 
                        },
                        transaction: moduleTransaction
                    });

                    if (foundUsers.length > 0) {
                        await newModule.setUsers(foundUsers, { transaction: moduleTransaction });
                    }
                }

                await moduleTransaction.commit();
            } catch (error) {
                await moduleTransaction.rollback();

                throw new Error(`Error creating module: ${error.message}`);
            }

            try {
                const sensorTransaction = await sequelize.transaction({
                    timeout: TRANSACTION_TIMEOUT
                });

                try {
                    const sensors = await this.sensorService.createDefaultSensorsForModule(
                        newModule.id,
                        sensorTransaction
                    );

                    await Promise.all(
                        sensors.map(sensor =>
                            this.thresholdService.createDefaultThresholds(sensor.id, sensorTransaction)
                        )
                    );

                    await sensorTransaction.commit();
                } catch (error) {
                    await sensorTransaction.rollback();
                    console.error(`Error creating sensors for the module ${newModule.id}:`, error);

                }
            } catch (sensorError) {
                console.error(`General error in sensor transaction:`, sensorError);
            }

            const owner = await User.findByPk(created_by_user_id, {
                attributes: ['email'],
                where: {
                    isActive: true
                }
            });
            await this.sendSensorCredentialsEmail(
                owner.email,
                sensorEmail,
                tempPassword,
                name
            );

            const result = await Module.findByPk(newModule.id, {
                where: {
                    isActive: true
                },
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name'],
                        where: {
                            isActive: true
                        }
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            return {
                statusCode: 201,
                data: [
                    {
                        module: result,
                        sensorUser: {
                            id: sensorUser.id,
                            email: sensorUser.email,
                            role: sensorUser.role
                        }
                    }
                ]
            };

        } catch (error) {
            console.error('General error in creating module:', error);
            throw new Error(`Error creating module and its components: ${error.message}`);
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
                id_farm,
                isActive: true
            }, {
                where: { 
                    id,
                    isActive: true 
                }
            });

            const moduleInstance = await Module.findByPk(id, {
                where: {
                    isActive: true
                }
            });

            if (users && users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users,
                        isActive: true
                    }
                });

                await moduleInstance.setUsers(foundUsers);
            }

            return await Module.findByPk(id, {
                where: {
                    isActive: true
                },
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name'],
                        where: {
                            isActive: true
                        }
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
                where: {
                    isActive: true
                },
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name'],
                        required: true,
                        where: {
                            isActive: true
                        }
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email'],
                        required: false,
                        where: {
                            isActive: true
                        }
                    },
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'email', 'dni'],
                        through: { attributes: [] },
                        required: false,
                        where: {
                            isActive: true
                        }
                    },
                    {
                        model: Sensor,
                        as: 'sensors',
                        attributes: ['id', 'name', 'type', 'isActive'],
                        required: false,
                        include: [
                            {
                                model: Threshold,
                                as: 'thresholds',
                                attributes: ['id', 'type', 'value', 'isActive'],
                                required: false
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
            const moduleToDelete = await Module.findByPk(id, {
                where: {
                    isActive: true
                }
            });

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
            const module = await Module.findByPk(moduleId, {
                where: {
                    isActive: true
                }
            });

            if (!module) {
                throw new Error('Module not found');
            }

            const sensors = await Sensor.findAll({
                where: { id_module: moduleId },
                attributes: ['id'],
                transaction
            });
            
            const sensorIds = sensors.map(sensor => sensor.id);

            await Module.update(
                { isActive: false },
                {
                    where: { id: moduleId },
                    transaction
                }
            );

            if (sensorIds.length > 0) {
                await Sensor.update(
                    { isActive: false },
                    {
                        where: { id_module: moduleId },
                        transaction
                    }
                );

                await Threshold.update(
                    { isActive: false },
                    {
                        where: { id_sensor: { [Op.in]: sensorIds } },
                        transaction
                    }
                );

                await Measurement.update(
                    { isActive: false },
                    {
                        where: { id_sensor: { [Op.in]: sensorIds } },
                        transaction
                    }
                );
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error(`Error performing soft delete of module: ${moduleId}:`, error);
            throw new Error(`Error deleting module: ${error.message}`);
        }
    }

    async assignMonitorToModule(moduleId, monitorIds) {
        const transaction = await sequelize.transaction();
        try {
            const moduleIdToUse = typeof moduleId === 'object' ? moduleId.id : moduleId;
            
            const monitorIdsArray = Array.isArray(monitorIds) ? monitorIds : [monitorIds];
            
            const assignmentPromises = monitorIdsArray.map(async (monitorId) => {
                const monitorIdToUse = typeof monitorId === 'object' ? monitorId.id : monitorId;
                
                const [moduleUser, created] = await ModuleUser.findOrCreate({
                    where: {
                        id_module: moduleIdToUse,
                        id_user: monitorIdToUse
                    },
                    defaults: { 
                        isActive: true
                    },
                    transaction
                });

                if (!created && !moduleUser.isActive) {
                    await moduleUser.update({ 
                        isActive: true
                    }, { transaction });
                }
                
                return moduleUser;
            });

            await Promise.all(assignmentPromises);
            
            await transaction.commit();

            return await Module.findByPk(moduleIdToUse, {
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni'],
                    through: { attributes: [] },
                    where: {
                        isActive: true
                    }
                }]
            });
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error assigning monitors to the module: ${error.message}`);
        }
    }

    async unassignMonitorFromModule(moduleId, monitorIds) {
        const transaction = await sequelize.transaction();
        try {
            const moduleIdToUse = typeof moduleId === 'object' ? moduleId.id : moduleId;
            const monitorIdsArray = Array.isArray(monitorIds) ? monitorIds : [monitorIds];
            
            await ModuleUser.update(
                { isActive: false },
                {
                    where: {
                        id_module: moduleIdToUse,
                        id_user: { [Op.in]: monitorIdsArray },
                        isActive: true
                    },
                    transaction
                }
            );

            await transaction.commit();

            const updatedModule = await Module.findByPk(moduleIdToUse, {
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni'],
                    through: { 
                        attributes: [],
                        where: {
                            isActive: true
                        }
                    },
                    where: {
                        isActive: true
                    }
                }]
            });

            return {
                statusCode: 200,
                data: updatedModule
            };
        } catch (error) {
            await transaction.rollback();
            console.error('Error unassigning monitors from module:', error);
            
            return {
                statusCode: 500,
                message: `Error unassigning monitors from module: ${error.message}`
            };
        }
    }
}

module.exports = ModuleOwnerService;