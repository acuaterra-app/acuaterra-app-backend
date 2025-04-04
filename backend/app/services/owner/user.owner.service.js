const { User, Rol, Farm, Module, ModuleUser, sequelize } = require('../../../models');
const { Op } = require('sequelize');
const { ROLES } = require('../../enums/roles.enum');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../../utils/Mailer');

class UserOwnerService {

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
                    'updatedAt'
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
                        model: Farm,
                        attributes: ['id', 'name'],
                        as: 'Farms',
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
        const transaction = await sequelize.transaction();
        
        try {
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
                throw new Error('Módulo no encontrado');
            }

            await ModuleUser.create({
                id_module: module.id,
                id_user: newUser.id
            }, { transaction });
            
            await transaction.commit();

            try {
                await sendEmail({
                    to: newUser.email,
                    subject: 'Bienvenido a Acuaterra - Credenciales de acceso',
                    text: `Hola ${newUser.name},\n\nSe ha creado tu cuenta como Monitor en Acuaterra.\n\nTus credenciales de acceso son:\nEmail: ${newUser.email}\nContraseña temporal: ${temporaryPassword}\n\nPor favor, cambia tu contraseña después de iniciar sesión.\n\nSaludos,\nEquipo de Acuaterra`,
                    html: `<p>Hola ${newUser.name},</p><p>Se ha creado tu cuenta como Monitor en Acuaterra.</p><p>Tus credenciales de acceso son:</p><ul><li>Email: ${newUser.email}</li><li>Contraseña temporal: ${temporaryPassword}</li></ul><p>Por favor, cambia tu contraseña después de iniciar sesión.</p><p>Saludos,<br>Equipo de Acuaterra</p>`
                });
            } catch (emailError) {
                console.error('Error al enviar email al nuevo monitor:', emailError);
            }

            const userWithAssociations = await User.findByPk(newUser.id, {
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
            if (transaction) await transaction.rollback();
            throw new Error(`Error al crear usuario monitor: ${error.message}`);
        }
    }
}

module.exports = UserOwnerService;