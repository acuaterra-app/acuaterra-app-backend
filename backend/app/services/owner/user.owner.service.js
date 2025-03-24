const { User, Rol, Farm } = require('../../../models');
const { Op } = require('sequelize');
const { ROLES } = require('../../enums/roles.enum');

/**
 * Specialized service for user-related operations for owners
 */
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
                        attributes: ['name'],
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

}

module.exports = UserOwnerService;

