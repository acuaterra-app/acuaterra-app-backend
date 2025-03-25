const { Farm, User } = require('../../../models');

class FarmOwnerService {

    async findFarmsByUserId(userId, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
        try {
            page = parseInt(page);
            limit = parseInt(limit);

            const offset = (page - 1) * limit;
            
            const { count, rows } = await Farm.findAndCountAll({
                limit: limit,
                offset: offset,
                order: [[sortField, sortOrder]],
                include: [{
                    model: User,
                    as: 'users',
                    attributes: [],  // No necesitamos traer datos de usuarios
                    through: {
                        attributes: []  // No necesitamos datos de la tabla pivote
                    },
                    where: {
                        id: userId  // Filtrar por el ID del usuario
                    }
                }],
                distinct: true
            });
            
            return {
                count: count,
                rows: rows,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                perPage: limit
            };
        } catch (error) {
            console.error(`Error fetching farms for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = FarmOwnerService;

