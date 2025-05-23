const { User, Farm, Module } = require('../../../models');
const ApiResponse = require('../../utils/apiResponse');
const { ROLES: Role } = require('../../enums/roles.enum');

class ValidateMonitorReactivateMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const monitorId = req.params.id;
            const loggedUserId = req.user.id;

            const monitorToReactivate = await User.findOne({
                where: {
                    id: monitorId,
                    id_rol: Role.MONITOR,
                    isActive: false
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

            if (!monitorToReactivate) {
                const response = ApiResponse.createApiResponse(
                    'Error reactivating monitor',
                    [],
                    [{ msg: `The monitor with ID ${monitorId} does not exist, is not a monitor, or is already active.` }]
                );
                return res.status(404).json(response);
            }

            if (!monitorToReactivate.assigned_modules || monitorToReactivate.assigned_modules.length === 0) {
                req.monitorToReactivate = monitorToReactivate;
                return next();
            }

            let hasAccessToAnyModule = false;

            for (const module of monitorToReactivate.assigned_modules) {
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
                        msg: 'You are not authorized to reactivate this monitor',
                        details: 'The monitor is assigned to modules that belong to farms you do not manage.'
                    }]
                );
                return res.status(403).json(response);
            }

            req.monitorToReactivate = monitorToReactivate;

            next();
        } catch (error) {
            console.error('Error during monitor reactivation validation:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'An error occurred while processing the monitor reactivation validation.',
                    details: error.message
                }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateMonitorReactivateMiddleware;