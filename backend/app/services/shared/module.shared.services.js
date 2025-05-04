const {Module, User, Farm, Rol, Sequelize} = require('../../../models');

class ModuleService {
    /**
     * Find all modules for a farm with pagination and sorting
     * @param {number} farmId - Farm ID to filter modules
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Number of records per page (default: 10)
     * @param {string} sortField - Field to sort by (default: 'createdAt')
     * @param {string} sortOrder - Sort direction, 'ASC' or 'DESC' (default: 'DESC')
     * @returns {object} - Paginated list of modules with metadata
     */
    async findAll(farmId, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
        try {
            page = parseInt(page);
            limit = parseInt(limit);

            const offset = (page - 1) * limit;

            const {count, rows} = await Module.unscoped().findAndCountAll({
                limit: limit,
                offset: offset,
                where: {
                    id_farm: farmId
                },
                order: [[sortField, sortOrder]],
                include: [
                    {
                        model: User.unscoped(),
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
                        model: Farm.unscoped(),
                        as: 'farm',
                        attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'isActive']
                    }
                ],
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

    /**
     * Toggle the active status of a module
     * @param {number} moduleId - ID of the module to toggle
     * @returns {object} - Updated module
     */
    async toggleActiveStatus(moduleId) {
        try {
            const module = await Module.scope('all').findByPk(moduleId);
            
            if (!module) {
                throw new Error(`Module with ID ${moduleId} not found`);
            }
            
            module.isActive = !module.isActive;
            await module.save();
            
            return module;
        } catch (error) {
            console.error(`Error toggling module active status: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ModuleService;

