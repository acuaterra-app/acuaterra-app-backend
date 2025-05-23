const { Module, User, Farm, ModuleUser } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');
const ApiResponse = require('../../utils/apiResponse');
const { Op } = require('sequelize');

class ValidateModuleMonitorAssignmentMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { moduleId } = req.params;
            const { action = 'assign', monitorIds } = req.body;

            if (!monitorIds) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Request',
                    [],
                    [{ 
                        msg: 'monitorIds is required',
                        details: 'You must provide at least one monitor ID'
                    }]
                );
                return res.status(400).json(response);
            }

            const monitorIdsArray = Array.isArray(monitorIds) ? monitorIds : [monitorIds];

            if (monitorIdsArray.length === 0) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Request',
                    [],
                    [{ 
                        msg: 'monitorIds array cannot be empty',
                        details: 'You must provide at least one monitor ID'
                    }]
                );
                return res.status(400).json(response);
            }

            if (!['assign', 'unassign'].includes(action)) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Action',
                    [],
                    [{ 
                        msg: 'Invalid action. Must be "assign" or "unassign"',
                        details: 'The action parameter must be either "assign" to add monitors or "unassign" to remove monitors'
                    }]
                );
                return res.status(400).json(response);
            }

            const module = await Module.findOne({
                where: { 
                    id: moduleId,
                    isActive: true
                },
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        required: true,
                        where: { isActive: true },
                        include: [
                            {
                                model: User,
                                as: 'users',
                                where: {
                                    id: ownerId,
                                    isActive: true
                                },
                                through: { attributes: [] }
                            }
                        ]
                    }
                ]
            });

            if (!module) {
                const response = ApiResponse.createApiResponse(
                    'Module Access Error',
                    [],
                    [{ 
                        msg: `The module with ID ${moduleId} does not exist, is inactive, or you don't have access to it`,
                        details: 'You must have owner access to the farm that contains this module'
                    }]
                );
                return res.status(403).json(response);
            }

            const monitors = await User.findAll({
                where: {
                    id: { [Op.in]: monitorIdsArray },
                    id_rol: ROLES.MONITOR,
                    isActive: true
                }
            });

            if (monitors.length !== monitorIdsArray.length) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Monitors',
                    [],
                    [{ 
                        msg: 'One or more monitors do not exist, are not monitors, or are inactive',
                        details: 'All provided IDs must correspond to active users with the monitor role'
                    }]
                );
                return res.status(400).json(response);
            }

            const existingRelations = await ModuleUser.findAll({
                where: {
                    id_module: moduleId,
                    id_user: { [Op.in]: monitorIdsArray }
                }
            });

            if (action === 'assign') {
                const activeAssignments = existingRelations.filter(rel => rel.isActive);
                if (activeAssignments.length > 0) {
                    const duplicateIds = activeAssignments.map(rel => rel.id_user);
                    const response = ApiResponse.createApiResponse(
                        'Duplicate Assignments',
                        [],
                        [{ 
                            msg: `Monitors with IDs ${duplicateIds.join(', ')} are already actively assigned to this module`,
                            details: 'Cannot create duplicate active assignments'
                        }]
                    );
                    return res.status(409).json(response);
                }
            } else if (action === 'unassign') {
                const activeAssignments = existingRelations.filter(rel => rel.isActive);
                if (activeAssignments.length === 0) {
                    const response = ApiResponse.createApiResponse(
                        'No Active Assignments',
                        [],
                        [{ 
                            msg: 'None of the provided monitors are actively assigned to this module',
                            details: 'Cannot unassign monitors that are not currently assigned'
                        }]
                    );
                    return res.status(404).json(response);
                }
            }

            req.validatedModule = module;
            req.validatedMonitors = monitors;
            req.existingRelations = existingRelations;
            req.monitorAction = action;

            next();
        } catch (error) {
            console.error('Error in module-monitor assignment validation:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{ 
                    msg: 'An error occurred while validating module-monitor assignment',
                    details: error.message 
                }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleMonitorAssignmentMiddleware;