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
                    [{ msg: 'The owner does not have any farms assigned to manage users' }]
                );
                return res.status(403).json(response);
            }

            const ownerFarmIds = ownerFarms.map(farm => farm.id);

            if (!monitorToDisable.assigned_modules || monitorToDisable.assigned_modules.length === 0) {
                return next();
            } else {
                let hasAccess = false;
                
                for (const module of monitorToDisable.assigned_modules) {
                    const farmId = module.id_farm;
                    
                    if (ownerFarmIds.includes(farmId)) {
                        hasAccess = true;
                        break;
                    }
                }
                
                if (!hasAccess) {
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

