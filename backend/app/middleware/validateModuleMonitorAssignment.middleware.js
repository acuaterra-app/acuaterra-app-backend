const { Module, Farm, User, ModuleUser } = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../enums/roles.enum');

class ValidateModuleMonitorAssignmentMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const ownerId = req.user.id;
            const { moduleId, monitorId } = req.params;
            const { action = 'assign' } = req.body;

            // Validar la acción
            if (!['assign', 'unassign'].includes(action)) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Action',
                    [],
                    [{ msg: 'Invalid action. Must be "assign" or "unassign"' }]
                );
                return res.status(400).json(response);
            }

            // Validate if module exists and is accessible by the owner
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
                    'Access Denied',
                    [],
                    [{ msg: 'You do not have access to this module or the module does not exist' }]
                );
                return res.status(403).json(response);
            }

            // Validate if monitor exists and has MONITOR role
            const monitor = await User.findOne({
                where: {
                    id: monitorId,
                    id_rol: ROLES.MONITOR,
                    isActive: true
                }
            });

            if (!monitor) {
                const response = ApiResponse.createApiResponse(
                    'Invalid Monitor',
                    [],
                    [{ msg: 'The specified user is not an active monitor' }]
                );
                return res.status(400).json(response);
            }

            // Validar la relación existente
            const existingRelation = await ModuleUser.findOne({
                where: {
                    id_module: moduleId,
                    id_user: monitorId
                }
            });

            if (action === 'assign' && existingRelation?.isActive) {
                const response = ApiResponse.createApiResponse(
                    'Error',
                    [],
                    [{ msg: 'Monitor is already assigned to this module' }]
                );
                return res.status(409).json(response);
            }

            if (action === 'unassign' && (!existingRelation || !existingRelation.isActive)) {
                const response = ApiResponse.createApiResponse(
                    'Error',
                    [],
                    [{ msg: 'Monitor is not assigned to this module' }]
                );
                return res.status(404).json(response);
            }

            // Pasar los datos validados al siguiente middleware/controlador
            req.validatedModule = module;
            req.validatedMonitor = monitor;
            req.existingRelation = existingRelation;
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

