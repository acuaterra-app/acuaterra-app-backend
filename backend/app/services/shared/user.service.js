const { User, Rol, sequelize, FarmUser, ModuleUser } = require('../../../models');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');
const {Op} = require("sequelize");

class UserService {
    constructor(mailer) {
        this.mailer = mailer;
    }

    async getAllUsers(page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC', roles = []) {
        try {
            page = parseInt(page);
            limit = parseInt(limit);

            const offset = (page - 1) * limit;

            return await User.findAndCountAll({
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    'id_rol',
                    'address',
                    'contact',
                    'createdAt',
                    'updatedAt'
                ],
                include: [
                    {
                        model: Rol,
                        attributes: ['name'],
                        as: 'rol'
                    }
                ],
                order: [[sortField, sortOrder]],
                where: {
                    isActive: true,
                    id_rol: {
                        [Op.and]: [
                            roles.length > 0 ? { [Op.or]: roles } : {},
                            { [Op.ne]: 4 }
                        ]
                    }
                },
                limit,
                offset
            });
        }catch(error){
            throw new Error(`Error getting users: ${error.message}`);
        }
    }

    async register(userData) {
        try {
            const { name, email, dni, id_rol, address, contact } = userData;

            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                dni,
                id_rol,
                address,
                contact,
                isActive: true
            });

            const resetPasswordUrl = process.env.RESET_PASSWORD_FRONTEND_URL;

            const subject = 'Registro Exitoso - Credenciales de Acceso - Configura tu contraseña';

            const htmlContent = await ejs.renderFile(
                path.join(__dirname, '../../views/emails/new_user.ejs'),
                { name, email, tempPassword, resetPasswordUrl }
            );

            await this.mailer.sendEmail(email, subject, htmlContent, process.env.RESEND_FROM_EMAIL);

            const { password, ...userWithoutPassword } = user.dataValues;
            return userWithoutPassword;

        } catch (error) {
            console.log(error)
            throw new Error("Error creating user.");
        }
    }

    async findUserById(id) {
        try {
            const user = await User.findOne({
                where: {
                    id,
                    isActive: true
                }
            });

            if (!user) {
                throw new Error(`User with id ${id} not found`);
            }

            return user;
        } catch (error) {
            console.error(`Error finding user with id ${id}:`, error);
            throw error;
        }
    }

    static async findAllUsers() {
        try {
            const users = await User.findAll({
                where: {
                    isActive: true
                }
            });
            return users;
        } catch (error) {
            throw error;
        }
    }

    static async findUsersByRole(roleId) {
        try {
            const users = await User.findAll({
                where: { 
                    id_rol: roleId,
                    isActive: true
                },
                include: [
                    {
                        model: Rol,
                        as: 'rol'
                    }
                ]
            });
            return users;
        } catch (error) {
            throw error;
        }
    }

    async editUser(id, userData) {
        try {
            const user = await User.findOne({
                where: {
                    id,
                    isActive: true
                }
            });

            if (!user) {
                throw new Error(`Usuario con id ${id} no encontrado`);
            }

            const {
                name, email, dni, id_rol, address, contact = [] } = userData;

            await User.update({
                name,
                email,
                dni,
                id_rol,
                address,
                contact,
                isActive: true
            }, {
                where: { id }
            });

            return await User.findByPk(id, {
                attributes: ['id', 'name', 'email', 'dni', 'id_rol', 'address', 'contact']
            });

        } catch (error) {
            console.error(`Error updating user with id ${id}:`, error);
            throw error;
        }
    }

    async softDeleteUser(userId) {
        const transaction = await sequelize.transaction();

        try {
            await User.update(
                { isActive: false },
                {
                    where: { id: userId },
                    transaction
                }
            );

            await FarmUser.update(
                { isActive: false },
                {
                    where: { id_user: userId },
                    transaction
                }
            );

            await ModuleUser.update(
                { isActive: false },
                {
                    where: { id_user: userId },
                    transaction
                }
            );

            await transaction.commit();
            console.log(`User ${userId} and their relationships successfully deactivated (soft delete)`);
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error(`Error performing soft delete of user ${userId}:`, error);
            throw new Error(`Error deactivating user: ${error.message}`);
        }
    }

    async deleteUser(id, currentUser) {
        try {
            const userToDelete = await User.findOne({
                where: {
                    id,
                    isActive: true
                }
            });
            
            if (!userToDelete) {
                throw new Error(`User with id ${id} not found`);
            }

            await this.softDeleteUser(id);
            
            return userToDelete;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = UserService;

