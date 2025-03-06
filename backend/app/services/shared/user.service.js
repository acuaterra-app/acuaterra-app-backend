const { User, Rol } = require('../../../models');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');

class UserService {
    constructor(mailer) {
        this.mailer = mailer;
    }

    static async getAllUsers() {
        try {
            return await User.findAll({
                attributes: [
                    'id',
                    'name',
                    'email',
                    'dni',
                    [Sequelize.col('rol.name'), 'id_rol']
                ],
                include: [
                    {
                        model: Rol,
                        attributes: [],
                        as: 'rol'
                    }
                ]
            });
        } catch (error) {
            throw new Error(`Error getting users: ${error.message}`);
        }
    }

    async register(userData) {
        try {
            const { name, email, dni, id_rol, address } = userData;

            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                dni,
                id_rol,
                address,
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

    static async findUserById(id) {
        try {
            const user = await User.findOne({ where: { id } });
            if (!user) {
                throw new Error('No se encontró el usuario.');
            }
            return user;
        } catch (error) {
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

    static async editUser(id_user, nuevoUser) {
        try {
            // Hash password if it's being updated
            if (nuevoUser.password) {
                nuevoUser.password = await bcrypt.hash(nuevoUser.password, 10);
            }
            
            const user = await User.findByPk(id_user)
            if (!user) {
                throw new Error('No se encontró el usuario.');
            }
            await user.update(nuevoUser);
            return user;
        } catch (error) {
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

