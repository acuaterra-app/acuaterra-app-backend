const { Module, Farm, User, Sensor, Measurement, Threshold, sequelize } = require('../../../models');
const SensorService = require("../shared/sensor.shared.service");
const ThresholdService = require("../shared/threshold.shared.service");
const Mailer = require("../../utils/Mailer");
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const bcrypt = require('bcrypt');
const { ROLES } = require('../../enums/roles.enum');
const { Op } = require('sequelize');

const TRANSACTION_TIMEOUT = 30000; // 30 seconds

class ModuleOwnerService {
    constructor() {
        this.sensorService = new SensorService();
        this.thresholdService = new ThresholdService();
        this.mailer = new Mailer;
    }

    generateSensorCredentials(moduleName) {
        const timestamp = Date.now();
        const email = `sensor.${moduleName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}@acuaterra.tech`;
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

            const owner = await User.findByPk(created_by_user_id, {
                attributes: ['email']
            });

            if (!owner) {
                throw new Error(`Usuario creador con ID ${created_by_user_id} no encontrado`);
            }

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
                        created_by_user_id
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
                    id_rol: ROLES.SENSOR,
                    name: `Sensor ${name}`,
                    status: 'active',
                    dni: 'SENSOR-' + Date.now(),
                    contact: JSON.stringify({
                        type: 'sensor',
                        moduleId: newModule.id
                    }),
                    address: `${location} (${latitude}, ${longitude})`
                }, { transaction: moduleTransaction });

                if (users && users.length > 0) {
                    const foundUsers = await User.findAll({
                        where: { id: { [Op.in]: users } },
                        transaction: moduleTransaction
                    });

                    if (foundUsers.length > 0) {
                        await newModule.setUsers(foundUsers, { transaction: moduleTransaction });
                    }
                }

                await moduleTransaction.commit();
            } catch (error) {
                await moduleTransaction.rollback();

                if (error.name === 'SequelizeUniqueConstraintError') {
                    throw new Error(`Ya existe un módulo con el nombre ${name}`);
                }

                throw new Error(`Error en la creación del módulo: ${error.message}`);
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

                    console.error(`Error creando sensores para el módulo ${newModule.id}:`, error);

                    if (error.name === 'SequelizeDatabaseError' &&
                        error.parent &&
                        error.parent.code === 'ER_LOCK_WAIT_TIMEOUT') {

                        setTimeout(async () => {
                            try {
                                const laterTransaction = await sequelize.transaction();
                                const sensors = await this.sensorService.createDefaultSensorsForModule(
                                    newModule.id,
                                    laterTransaction
                                );

                                const promises = [];
                                for (const sensor of sensors) {
                                    promises.push(
                                        this.thresholdService.createDefaultThresholds(sensor.id, laterTransaction)
                                    );
                                }

                                await Promise.all(promises);
                                await laterTransaction.commit();
                            } catch (retryError) {
                                console.error(`Error en creación diferida de sensores:`, retryError);
                            }
                        }, 5000);
                    }
                }
            } catch (sensorError) {
                console.error(`Error general en transacción de sensores:`, sensorError);
            }

            if (!owner || !owner.email) {
                console.error('No se puede enviar email: falta email del propietario');
            } else if (!sensorEmail || !tempPassword) {
                console.error('No se puede enviar email: faltan credenciales del sensor', {
                    hasSensorEmail: !!sensorEmail,
                    hasPassword: !!tempPassword
                });
            } else {
                try {
                    const emailResult = await this.sendSensorCredentialsEmail(
                        owner.email,
                        sensorEmail,
                        tempPassword,
                        name
                    );

                    if (emailResult.success) {
                        console.log(`Email de credenciales enviado exitosamente para el módulo ${name}`);
                    } else {
                        console.error(`Fallo en el envío de email para el módulo ${name}:`, emailResult.error);
                    }
                } catch (emailError) {
                    console.error(`Error inesperado en el envío de email para el módulo ${name}:`, emailError);
                }
            }

            const result = await Module.findByPk(newModule.id, {
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

            return {
                statusCode: 201,
                data: {
                    module: result,
                    sensorUser: {
                        id: sensorUser.id,
                        email: sensorUser.email,
                        role: sensorUser.role
                    }
                }
            };

        } catch (error) {
            console.error('Error general creating module:', error);
            throw new Error(`Error en la creación del módulo y sus componentes: ${error.message}`);
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
            console.error(`Error actualizando módulo con id ${id}:`, error);
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