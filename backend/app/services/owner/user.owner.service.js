const { User, Rol, Farm, Module, ModuleUser, sequelize } = require('../../../models');
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

    async getMonitorUsers(page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
        try {
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            
            const offset = (page - 1) * limit;
            
            sortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
            
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
                    id_rol: ROLES.MONITOR,
                    isActive: true
                },
                include: [
                    {
                        model: Rol,
                        attributes: ['id', 'name'],
                        as: 'rol'
                    },
                    {
                        model: Farm,
                        attributes: ['id', 'name'],
                        as: 'Farms',
                        where: { isActive: true },
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

            const module = await Module.findByPk(data.id_module, {
                transaction
            });
            
            if (!module) {
                await transaction.rollback();
                throw new Error('Module not found');
            }

            await ModuleUser.create({
                id_module: module.id,
                id_user: newUser.id
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
                    },
                    { 
                        model: Module, 
                        as: 'assigned_modules', 
                        attributes: ['id', 'name', 'location', 'species_fish'], 
                        through: { attributes: [] } 
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

            if (data.id_module) {
                const module = await Module.findByPk(data.id_module, {
                    transaction
                });

                if (!module) {
                    await transaction.rollback();
                    throw new Error('Module not found');
                }

                await ModuleUser.destroy({
                    where: { id_user: existingUser.id },
                    transaction
                });

                await ModuleUser.create({
                    id_module: module.id,
                    id_user: existingUser.id
                }, { transaction });
            }

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
                    },
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'location', 'species_fish'],
                        through: { attributes: [] }
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
}

module.exports = UserOwnerService;