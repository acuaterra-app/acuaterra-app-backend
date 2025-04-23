const { Farm, User, Rol } = require('../../../models');

class FarmSharedService {
    async getFarmDetails(farmId) {
        try {
            const farm = await Farm.findOne({
                where: { 
                    id: farmId,
                    isActive: true 
                },
                include: [
                    {
                        model: User,
                        as: 'users',
                        where: { isActive: true },
                        through: { attributes: [] },
                        include: [
                            {
                                model: Rol,
                                as: 'rol',
                                attributes: ['id', 'name']
                            }
                        ],
                        attributes: ['id', 'name', 'email', 'dni', 'id_rol']
                    }
                ]
            });

            if (!farm) {
                throw new Error(`No farm was found with the ID: ${farmId}`);
            }

            return farm;
        } catch (error) {
            throw error;
        }
    }

    async checkUserHasAccessToFarm(userId, farmId) {
        try {
            const farm = await Farm.findOne({
                where: { 
                    id: farmId,
                    isActive: true 
                },
                include: [
                    {
                        model: User,
                        as: 'users',
                        where: { 
                            id: userId,
                            isActive: true 
                        },
                        through: { attributes: [] }
                    }
                ]
            });

            if (!farm) {
                throw new Error('You do not have access to this farm');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new FarmSharedService();
