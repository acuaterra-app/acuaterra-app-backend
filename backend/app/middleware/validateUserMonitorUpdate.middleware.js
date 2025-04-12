const { User, Farm, Module, sequelize } = require('../../models');
const ApiResponse = require('../utils/apiResponse');

class ValidateUserMonitorUpdateMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const userId = req.params.id;
            const loggedUserId = req.user.id;

            const userToUpdate = await User.findOne({
                where: {
                    id: userId,
                    isActive: true
                },
                include: [
                    {
                        model: Module,
                        as: 'assigned_modules',
                        attributes: ['id', 'name', 'id_farm'],
                        include: [{
                            model: Farm,
                            as: 'farm',
                            attributes: ['id', 'name']
                        }]
                    }
                ]
            });

            if (!userToUpdate) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{ msg: `User with id ${userId} not found in the system or is inactive` }]
                )
                return res.status(404).json(response);
            }

            if (userToUpdate.assigned_modules && userToUpdate.assigned_modules.length > 0) {
                let hasAccessToAnyModule = false;
                
                for (const module of userToUpdate.assigned_modules) {
                    if (!module.farm) continue;
                    
                    const farmAccess = await Farm.findOne({
                        where: { 
                            id: module.farm.id,
                            isActive: true
                        },
                        include: [{
                            model: User,
                            as: 'users',
                            where: { 
                                id: loggedUserId,
                                isActive: true 
                            },
                            through: { attributes: [] }
                        }]
                    });
                    
                    if (farmAccess) {
                        hasAccessToAnyModule = true;
                        break;
                    }
                }
                
                if (!hasAccessToAnyModule) {
                    const response = ApiResponse.createApiResponse(
                        'Authorization Error',
                        [],
                        [{
                            msg: 'You are not authorized to edit this Monitor user',
                            details: 'The monitor is assigned to modules from farms that you do not manage'
                        }]
                    )
                    return res.status(403).json(response);
                }
            }

            if (req.body.id_module) {
                const moduleToAssign = await Module.findOne({
                    where: { 
                        id: req.body.id_module,
                        isActive: true
                    },
                    include: [{
                        model: Farm,
                        as: 'farm',
                        where: { isActive: true },
                        include: [{
                            model: User,
                            as: 'users',
                            where: { 
                                id: loggedUserId,
                                isActive: true 
                            },
                            through: { attributes: [] }
                        }]
                    }]
                });

                if (!moduleToAssign) {
                    const moduleExists = await Module.findByPk(req.body.id_module, {
                        include: [{
                            model: Farm,
                            as: 'farm',
                            attributes: ['id', 'name']
                        }]
                    });

                    if (!moduleExists) {
                        const response = ApiResponse.createApiResponse(
                            'Validation Error',
                            [],
                            [{ msg: `Module with id ${req.body.id_module} does not exist in the system` }]
                        )
                        return res.status(404).json(response);
                    }

                    if (!moduleExists.farm) {
                        const response = ApiResponse.createApiResponse(
                            'Validation Error',
                            [],
                            [{ msg: `Module with id ${req.body.id_module} has no associated farm` }]
                        )
                        return res.status(404).json(response);
                    }

                    const response = ApiResponse.createApiResponse(
                        'Authorization Error',
                        [],
                        [{
                            msg: 'You cannot assign this module because it belongs to a different farm',
                            details: `The module belongs to the farm ${moduleExists.farm.name}, which you do not manage`
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