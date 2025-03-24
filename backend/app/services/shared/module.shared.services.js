const {Module, User, Farm, Rol} = require('../../../models');

class ModuleService {
    async findAll(farmId, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
        try {
            page = parseInt(page);
            limit = parseInt(limit);

            const offset = (page - 1) * limit;

            const {count, rows} = await Module.findAndCountAll({
                limit: limit,
                offset: offset,
                order: [[sortField, sortOrder]],
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                        include: [
                            {
                                model: Rol,
                                as: 'rol',
                                attributes: ['id', 'name']
                            }
                        ],
                    },
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                    }
                ],
                where: {
                    id_farm: farmId
                },
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
            console.error("Error fetching modules:", error);
            throw error;
        }
    }
}

module.exports = ModuleService;

