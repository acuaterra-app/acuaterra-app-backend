const { User, Farm, Module, ROLES } = require('../../models');
const ApiResponse = require('../utils/apiResponse');
const { ROLES: Role } = require('../enums/roles.enum');

class ValidateMonitorDisableMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const monitorId = req.params.id;
            const loggedUserId = req.user.id;

            const monitorToDisable = await User.findOne({
                where: {
                    id: monitorId,
                    id_rol: Role.MONITOR,
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

            if (!monitorToDisable) {
                const response = ApiResponse.createApiResponse(
                    'Error disabling monitor',
                    [],
                    [{ msg: `The monitor with ID ${monitorId} does not exist or is already disabled.` }]
                );
                return res.status(404).json(response);
            }

            if (!monitorToDisable.assigned_modules || monitorToDisable.assigned_modules.length === 0) {
                req.monitorToDisable = monitorToDisable;
                return next();
            }

            let hasAccessToAnyModule = false;
            
            for (const module of monitorToDisable.assigned_modules) {
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
                        msg: 'You are not authorized to disable this monitor',
                        details: 'The monitor is assigned to modules that belong to farms that you do not manage.'
                    }]
                );
                return res.status(403).json(response);
            }

            req.monitorToDisable = monitorToDisable;
            
            next();
        } catch (error) {
            console.error('Error in monitor disable validation:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'An error occurred while processing the monitor disable validation.',
                    details: error.message
                }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateMonitorDisableMiddleware;

