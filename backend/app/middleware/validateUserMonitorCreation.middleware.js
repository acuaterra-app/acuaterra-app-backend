const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../enums/roles.enum');
const { Module, Farm, FarmUser } = require('../../models');

class ValidateUserMonitorCreationMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const { id_module } = req.body;
            const user = req.user;

            if (req.body.id_rol && Number(req.body.id_rol) !== ROLES.MONITOR) {
                return res.status(400).json(
                    ApiResponse.createApiResponse('Validation failed',
                        [],
                        [{
                        'error': 'The assigned role must be Monitor (3)'
                    }])
                );
            }

            if (!req.body.id_rol) {
                req.body.id_rol = ROLES.MONITOR;
            }

            if (!id_module) {
                return res.status(400).json(
                    ApiResponse.createApiResponse('Validation failed',
                        [],
                        [{
                        'error': 'A valid module ID is required'
                    }])
                );
            }

            const module = await Module.findByPk(id_module, {
                include: [{
                    model: Farm,
                    as: 'farm'
                }]
            });

            if (!module) {
                return res.status(404).json(
                    ApiResponse.createApiResponse('Validation failed',
                        [],
                        [{
                        'error': 'The specified module does not exist'
                    }])
                );
            }

            const farmId = module.farm.id;

            const farmUserRelation = await FarmUser.findOne({
                where: {
                    id_user: user.id,
                    id_farm: farmId
                }
            });

            if (!farmUserRelation) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Validation failed',
                        [],
                        [{
                        'error': 'You do not have permission to create monitors in this module.'
                    }])
                );
            }

            next();
        } catch (error) {
           throw new Error('Error in monitor creation validation: ' + error)
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error',
                    [],
                    [{
                    'error': 'Error validating monitor creation: '+ error.message
                }])
            );
        }
    }
}

module.exports = ValidateUserMonitorCreationMiddleware;

