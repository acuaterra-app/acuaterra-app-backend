const { Farm, User, FarmUser, sequelize } = require('../../../models');

class FarmAdminService {
    async create(farmData) {
        try {
            const {name, address, latitude, longitude, users} = farmData;

            const newFarm = await Farm.create({
                name,
                address,
                latitude,
                longitude,
                isActive: true
            });

            if (users && users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users,
                        isActive: true
                    }
                });

                await newFarm.addUsers(foundUsers);
            }

            return await Farm.findByPk(newFarm.id, {
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                    through: {attributes: []}
                }]
            });
        } catch (error) {
            console.error("Error creating farm:", error);
            throw error;
        }
    }

    async findAll(page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'DESC') {
        try {
            page = parseInt(page);
            limit = parseInt(limit);

            const offset = (page - 1) * limit;
            
            const { count, rows } = await Farm.findAndCountAll({
                limit: limit,
                offset: offset,
                order: [[sortField, sortOrder]],
                where: {
                    isActive: true
                },
                include: [
                    {
                        as: 'users',
                        model: User,
                        attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                        through: {attributes: []},
                        where: {
                            isActive: true
                        }
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
            console.error("Error fetching farms:", error);
            throw error;
        }
    }

    async findById(id) {

        try {
            const farm = await Farm.findByPk(id, {
                where: {
                    isActive: true
                },
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                    through: {attributes: []},
                    where: {
                        isActive: true
                    }
                }]
            });

            if (!farm) {
                throw new Error(`Farm with id ${id} not found`);
            }

            return farm;
        } catch (error) {
            console.error(`Error fetching farm with id ${id}:`, error);
            throw error;
        }
    }

    async update(id, farmData) {
        try {
            const farm = await this.findById(id);
            
            const { name, address, latitude, longitude, users = [] } = farmData;
            
            await Farm.update({
                name,
                address,
                latitude,
                longitude,
                isActive: true
            }, {
                where: { id }
            });
            
            if (users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users,
                        isActive: true
                    }
                });
                
                await farm.setUsers(foundUsers);
            }
            
            return await Farm.findByPk(id, {
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                    through: { attributes: [] },
                    where: {
                        isActive: true
                    }
                }]
            });
        } catch (error) {
            console.error(`Error updating farm with id ${id}:`, error);
            throw error;
        }
    }

    async delete(farmId) {
        const transaction = await sequelize.transaction();
        try {
            const farm = await Farm.findByPk(farmId, {
                where: {
                    isActive: true
                },
                transaction
            });
            
            if (!farm) {
                throw new Error('Farm not found');
            }

            await Farm.update(
                { isActive: false },
                {
                    where: { id: farmId },
                    transaction
                }
            );

            await FarmUser.update(
                { isActive: false },
                {
                    where: { id_farm: farmId },
                    transaction
                }
            );

            await transaction.commit();
            
            return { message: 'Farm deleted successfully' };
        } catch (error) {
            await transaction.rollback();
            console.error(`Error deleting farm with id ${farmId}:`, error);
            throw error;
        }
    }
}

module.exports = FarmAdminService;