const { User, Rol } = require('../../../models');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');

class UserService {
    constructor(mailer) {
        this.mailer = mailer;
    }

    async getAllUsers(page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
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
                contact
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
            const user = await User.findByPk(id);

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
            const users = await User.findAll();
            return users;
        } catch (error) {
            throw error;
        }
    }

    static async findUsersByRole(roleId) {
        try {
            const users = await User.findAll({
                where: { id_rol: roleId },
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
            const user = await User.findByPk(id);

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
                contact
            }, {
                where: { id }
            });

            return await User.findByPk(id, {
                attributes: ['id', 'name', 'email', 'dni', 'id_rol', 'address', 'contact'],
                include: [{
                    model: Rol,
                    attributes: ['id', 'name']
                }]
            });

        } catch (error) {
            console.error(`Error updating user with id ${id}:`, error);
            throw error;
        }
    }

    static async deleteUser(id) {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw new Error('No se encontró el usuario.');
            }
            await User.destroy({ where: { id } });
            return user;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = UserService;

