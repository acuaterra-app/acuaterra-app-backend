const { Farm, User } = require('../../models');

class FarmService {
    async create(farmData) {
        try {
            const {name, address, latitude, longitude, users} = farmData;

            const newFarm = await Farm.create({
                name,
                address,
                latitude,
                longitude
            });

            if (users && users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users
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
                limit,
                offset,
                order: [[sortField, sortOrder]],
                include: [
                    {
                        as: 'users',
                        model: User,
                        attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                        through: {attributes: []}
                    }
                ],
                distinct: true
            });
            
            return {
                count,
                rows,
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
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                    through: {attributes: []}
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
                longitude
            }, {
                where: { id }
            });
            
            if (users.length > 0) {
                const foundUsers = await User.findAll({
                    where: {
                        id: users
                    }
                });
                
                await farm.setUsers(foundUsers);
            }
            
            return await Farm.findByPk(id, {
                include: [{
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'dni', 'id_rol'],
                    through: { attributes: [] }
                }]
            });
        } catch (error) {
            console.error(`Error updating farm with id ${id}:`, error);
            throw error;
        }
    }

    async delete(id) {
        try {
            // Check if farm exists - this will throw an error if not found
            await this.findById(id);
            
            // Delete the farm
            await Farm.destroy({
                where: { id }
            });
            
            return { id };
        } catch (error) {
            console.error(`Error deleting farm with id ${id}:`, error);
            throw error;
        }
    }
}

module.exports = FarmService;
