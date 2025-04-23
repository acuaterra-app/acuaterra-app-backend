const { User, Rol, Farm, Module, ModuleUser, FarmUser, sequelize } = require('../../../models');
const { Op } = require('sequelize');
const { ROLES } = require('../../enums/roles.enum');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const ejs = require('ejs');
const path = require('path');
const Mailer = require('../../utils/Mailer');

class UserOwnerService {
    constructor(mailer) {
        this.mailer = mailer || new Mailer(process.env.RESEND_API_KEY);
    }

    async getMonitorUsers(ownerId, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC', moduleIds = []) {
        try {
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            
            const offset = (page - 1) * limit;
            
            sortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
            
            if (!moduleIds || moduleIds.length === 0) {
                const ownerModules = await Module.findAll({
                    attributes: ['id'],
                    include: [
                        {
                            model: Farm,
                            as: 'farm',
                            where: { isActive: true },
                            include: [
                                {
                                    model: User,
                                    as: 'users',
                                    where: { 
                                        id: ownerId,
                                        isActive: true 
                                    },
                                    through: { attributes: [] }
                                }
                            ]
                        }
                    ]
                });
                
                moduleIds = ownerModules.map(module => module.id);
            }
            
            if (moduleIds.length === 0) {
                return {
                    count: 0,
                    rows: [],
                    totalPages: 0,
                    currentPage: page,
                    perPage: limit
                };
            }
            
            const result = await User.findAndCountAll({
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'id_rol',
                    'address',
                    'contact',
                    'createdAt',
                    'updatedAt',
                    'isActive'
                ],
                where: {
                    id_rol: ROLES.MONITOR
                },
                include: [
                    {
                        model: Rol,
                        attributes: ['id', 'name'],
                        as: 'rol'
                    },
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'location', 'species_fish'],
                        required: false, // Hace que la relación sea opcional
                        where: moduleIds.length > 0 ? { // Aplica el filtro solo si hay moduleIds
                            id: { [Op.in]: moduleIds },
                            isActive: true
                        } : undefined,
                        through: { attributes: [] }
                    }
                ],
                order: [[sortField, sortOrder]],
                limit,
                offset
            });
            
            const totalPages = Math.ceil(result.count / limit);
            
            return {
                count: result.count,
                rows: result.rows,
                totalPages,
                currentPage: page,
                perPage: limit
            };
        } catch (error) {
            throw new Error(`Error getting monitor users: ${error.message}`);
        }
    }

    async createMonitorUser(data) {
        let transaction = null;
        
        try {
            transaction = await sequelize.transaction();
            
            const temporaryPassword = uuidv4().substring(0, 8);
            const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
            
            const newUser = await User.create({
                name: data.name,
                email: data.email,
                dni: data.dni,
                address: data.address || null,
                contact: data.contact,
                password: hashedPassword,
                id_rol: ROLES.MONITOR,
                createdBy: data.createdBy || null,
                updatedBy: data.updatedBy || null
            }, { transaction });
            
            const resetPasswordUrl = process.env.RESET_PASSWORD_FRONTEND_URL || 'https://acuaterra.tech/reset-password';
            const subject = 'Bienvenido a Acuaterra Usuario Monitor - Credenciales de acceso';
            
            try {
                const htmlContent = await ejs.renderFile(
                    path.join(__dirname, '../../views/emails/new_user.ejs'),
                    { 
                        name: newUser.name, 
                        email: newUser.email, 
                        tempPassword: temporaryPassword, 
                        resetPasswordUrl 
                    }
                );
                
                const emailResult = await this.mailer.sendEmail(
                    newUser.email, 
                    subject, 
                    htmlContent, 
                    process.env.RESEND_FROM_EMAIL
                );
                
                if (!emailResult || !emailResult.success) {
                    await transaction.rollback();
                    throw new Error('Error sending email to the new monitor user. Please try again.\n');
                }

            } catch (emailError) {
                await transaction.rollback();
                throw new Error(`Error sending email to the new monitor user: ${emailError.message}`);
            }
            
            await transaction.commit();
            
            const userWithAssociations = await User.findByPk(newUser.id, {
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'address',
                    'contact',
                    'id_rol',
                    'createdAt',
                    'updatedAt'
                ],
                include: [
                    { 
                        model: Rol, 
                        as: 'rol', 
                        attributes: ['id', 'name'] 
                    }
                ]
            });

            return userWithAssociations;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw new Error(`Error creation User Monitor: ${error.message}`);
        }
    }

    async updateMonitorUser(userId, data) {
        let transaction = null;

        try {
            transaction = await sequelize.transaction();

            const existingUser = await User.findOne({
                where: {
                    id: userId,
                    isActive: true
                },
                transaction
            });

            if (!existingUser) {
                await transaction.rollback();
                throw new Error('Active user not found');
            }

            await existingUser.update({
                name: data.name || existingUser.name,
                email: data.email || existingUser.email,
                dni: data.dni || existingUser.dni,
                address: data.address || existingUser.address,
                contact: data.contact || existingUser.contact,
                updatedBy: data.updatedBy || null
            }, { transaction });

            await transaction.commit();

            const updatedUser = await User.findByPk(existingUser.id, {
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'address',
                    'contact',
                    'id_rol',
                    'createdAt',
                    'updatedAt'
                ],
                include: [
                    {
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'name']
                    }
                ]
            });

            return updatedUser;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw new Error(`Error updating monitor user: ${error.message}`);
        }
    }

    async disableMonitor(monitorUser) {
        let transaction = null;

        try {
            transaction = await sequelize.transaction();

            await monitorUser.update({
                isActive: false
            }, { transaction });

            await transaction.commit();

            const disabledUser = await User.findByPk(monitorUser.id, {
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'address',
                    'contact',
                    'id_rol',
                    'isActive',
                    'createdAt',
                    'updatedAt'
                ],
                include: [
                    {
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'location', 'species_fish'],
                        through: { attributes: [] }
                    }
                ]
            });

            return disabledUser;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw new Error(`Error disabling the monitor: ${error.message}`);
        }
    }

    async reactivateMonitor(monitorToReactivate) {
        let transaction = null;

        try {
            transaction = await sequelize.transaction();

            await monitorToReactivate.update({
                isActive: true
            }, { transaction });

            await transaction.commit();

            const reactivatedUser = await User.findByPk(monitorToReactivate.id, {
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'address',
                    'contact',
                    'id_rol',
                    'isActive',
                    'createdAt',
                    'updatedAt'
                ],
                include: [
                    {
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'location', 'species_fish'],
                        through: { attributes: [] }
                    }
                ]
            });

            return reactivatedUser;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw new Error(`Error reactivating the monitor: ${error.message}`);
        }
    }

    async getActiveMonitors(ownerId = null) {
        try {
            if (!ownerId) {
                const allMonitors = await User.findAll({
                    attributes: ['id', 'name'],
                    where: {
                        id_rol: ROLES.MONITOR,
                        isActive: true
                    },
                    order: [['name', 'ASC']]
                });
                return allMonitors.map(monitor => ({
                    id: monitor.id,
                    fullName: monitor.name
                }));
            }

            const ownerModules = await Module.findAll({
                where: { isActive: true },
                include: [{
                    model: Farm,
                    as: 'farm',
                    where: { isActive: true },
                    include: [{
                        model: User,
                        as: 'users',
                        required: true,
                        where: {
                            id: ownerId,
                            isActive: true
                        },
                        through: { attributes: [] }
                    }]
                }]
            });

            if (!ownerModules || ownerModules.length === 0) {
                return [];
            }

            const moduleIds = ownerModules.map(module => module.id);

            const monitors = await User.findAll({
                attributes: ['id', 'name'],
                where: {
                    id_rol: ROLES.MONITOR,
                    isActive: true
                },
                include: [{
                    model: Module,
                    as: 'assigned_modules',
                    where: {
                        id: { [Op.in]: moduleIds },
                        isActive: true
                    },
                    through: { attributes: [] }
                }],
                order: [['name', 'ASC']],
                distinct: true
            });

            return monitors.map(monitor => ({
                id: monitor.id,
                fullName: monitor.name
            }));
        } catch (error) {
            console.error("Error getting active monitors:", error);
            throw new Error(`Error getting active monitors: ${error.message}`);
        }
    }
}

module.exports = UserOwnerService;