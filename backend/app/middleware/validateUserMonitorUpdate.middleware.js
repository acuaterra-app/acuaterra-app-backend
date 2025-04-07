const { User, Farm, Module, sequelize } = require('../../models');
const ApiResponse = require('../utils/apiResponse');

class ValidateUserMonitorUpdateMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const userId = req.params.id;
            const loggedUserId = req.user.id;

            const userToUpdate = await User.findByPk(userId, {
                include: [
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'id_farm'],
                    }
                ]
            });

            if (!userToUpdate) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{ msg: `User with id ${userId} not found in the system` }]
                )
                return res.status(404).json(response);
            }

            const ownerFarms = await Farm.findAll({
                include: [{
                    model: User,
                    as: 'users',
                    where: { id: loggedUserId },
                    attributes: [],
                    through: { attributes: [] }
                }]
            });

            if (!ownerFarms || ownerFarms.length === 0) {
                const response = ApiResponse.createApiResponse(
                    'Authorization Error',
                    [],
                    [{ msg: 'The Owner does not have any assigned farms to manage users' }]
                )
                return res.status(403).json(response);
            }

            const ownerFarmIds = ownerFarms.map(farm => farm.id);

            if (!userToUpdate.assigned_modules || userToUpdate.assigned_modules.length === 0) {
                if (req.body.id_module) {
                    const moduleToAssign = await Module.findByPk(req.body.id_module, {
                        include: [{
                            model: Farm,
                            as: 'farm',
                            attributes: ['id', 'name']
                        }]
                    });

                    if (!moduleToAssign) {
                        const response = ApiResponse.createApiResponse(
                            'Validation Error',
                            [],
                            [{ msg: `Module with id ${req.body.id_module} does not exist in the system` }]
                        )
                        return res.status(404).json(response);
                    }

                    if (!moduleToAssign.farm) {
                        const response = ApiResponse.createApiResponse(
                            'Validation Error',
                            [],
                            [{ msg: `Module with id ${req.body.id_module} has no associated farm` }]
                        )
                        return res.status(404).json(response);
                    }

                    if (!ownerFarmIds.includes(moduleToAssign.farm.id)) {
                        const response = ApiResponse.createApiResponse(
                            'Authorization Error',
                            [],
                            [{
                                msg: 'You cannot assign this module because it belongs to a different farm',
                                details: `The module belongs to the farm ${moduleToAssign.farm.name}, which is not managed by you`
                            }]
                        )
                        return res.status(403).json(response);
                    }
                } else {
                    return next();
                }
            } else {
                for (const module of userToUpdate.assigned_modules) {
                    const farmId = module.id_farm;

                    if (!ownerFarmIds.includes(farmId)) {
                        const response = ApiResponse.createApiResponse(
                            'Authorization Error',
                            [],
                            [{
                                msg: 'You are not authorized to edit this Monitor user',
                                details: `The monitor is assigned to module ${module.name} which belongs to a farm that you do not manage`
                            }]
                        )
                        return res.status(403).json(response);
                    }
                }
            }

            if (req.body.id_module) {
                const moduleToAssign = await Module.findByPk(req.body.id_module, {
                    include: [{
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    }]
                });

                if (!moduleToAssign) {
                    const response = ApiResponse.createApiResponse(
                        'Validation Error',
                        [],
                        [{ msg: `Module with id ${req.body.id_module} does not exist in the system` }]
                    )
                    return res.status(404).json(response);
                }

                if (!moduleToAssign.farm) {
                    const response = ApiResponse.createApiResponse(
                        'Validation Error',
                        [],
                        [{ msg: `Module with id ${req.body.id_module} has no associated farm` }]
                    )
                    return res.status(404).json(response);
                }

                if (!ownerFarmIds.includes(moduleToAssign.farm.id)) {
                    const response = ApiResponse.createApiResponse(
                        'Authorization Error',
                        [],
                        [{
                            msg: 'You cannot assign this module because it belongs to a different farm',
                            details: `The module belongs to the farm ${moduleToAssign.farm.name}, which is not managed by you (${ownerFarmIds.join(', ')})`
                        }]
                    )
                    return res.status(403).json(response);
                }
            }

            next();
        } catch (error) {
            console.error('Monitor update validation error:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'Error processing monitor user validation',
                    details: error.message
                }]
            )
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateUserMonitorUpdateMiddleware;