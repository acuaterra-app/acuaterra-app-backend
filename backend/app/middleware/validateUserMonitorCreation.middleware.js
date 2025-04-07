const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../enums/roles.enum');
const { Module, Farm, User } = require('../../models');

class ValidateUserMonitorCreationMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const { id_module } = req.body;
            const loggedUserId = req.user.id;

            if (req.body.id_rol && Number(req.body.id_rol) !== ROLES.MONITOR) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{
                        msg: 'The assigned role must be Monitor (3)'
                    }]
                )
                return res.status(400).json(response);
            }

            if (!req.body.id_rol) {
                req.body.id_rol = ROLES.MONITOR;
            }

            if (!id_module) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{
                        msg: 'A valid module ID is required'
                    }]
                )
                return res.status(400).json(response);
            }

            const module = await Module.findByPk(id_module, {
                include: [{
                    model: Farm,
                    as: 'farm',
                    attributes: ['id', 'name']
                }]
            });

            if (!module) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{
                        msg: `The module with ID ${id_module} does not exist in the system`
                    }]
                )
                return res.status(404).json(response);
            }

            if (!module.farm) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{
                        msg: `The module with ID ${id_module} does not have an associated farm`
                    }]
                )
                return res.status(404).json(response);
            }

            const farmId = module.farm.id;

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
                    [{
                        msg: 'The owner does not have any farms assigned to manage users'
                    }]
                )
                return res.status(403).json(response);
            }

            const ownerFarmIds = ownerFarms.map(farm => farm.id);

            if (!ownerFarmIds.includes(farmId)) {
                const response = ApiResponse.createApiResponse(
                    'Authorization Error',
                    [],
                    [{
                        msg: 'You do not have permission to create monitors in this module',
                        details: `The module belongs to the farm ${module.farm.name}, which you do not manage`
                    }]
                )
                return res.status(403).json(response);
            }

            next();
        } catch (error) {
            console.error('Error in monitor creation validation:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'An error occurred while processing monitor user creation validation',
                    details: error.message
                }]
            )
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateUserMonitorCreationMiddleware;