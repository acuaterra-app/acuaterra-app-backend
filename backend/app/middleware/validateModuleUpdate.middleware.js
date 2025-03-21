const { FarmUser, User, Module } = require('../../models');
const { ROLES } = require('../enums/roles.enum');
const ApiResponse = require('../utils/apiResponse');

class ValidateModuleUpdateMiddleware {
    async validate(req, res, next) {
        try {
            const authenticatedUser = req.user;
            const moduleId = req.params.id;
            const { id_farm, users } = req.body;

            const module = await Module.findByPk(moduleId);
            if (!module) {
                const response = ApiResponse.createApiResponse(
                    'Not found',
                    [],
                    [{
                        msg: 'Module not found'
                    }]
                );
                return res.status(404).json(response);
            }

            const farmUserAssociation = await FarmUser.findOne({
                where: {
                    id_user: authenticatedUser.id,
                    id_farm: module.id_farm
                }
            });

            if (!farmUserAssociation) {
                const response = ApiResponse.createApiResponse(
                    'Authorization failed',
                    [],
                    [{
                        msg: 'Owner does not have permission to update modules in farm ID ' + module.id_farm
                    }]
                );
                return res.status(403).json(response);
            }

            if (id_farm && id_farm !== module.id_farm) {
                const newFarmAssociation = await FarmUser.findOne({
                    where: {
                        id_user: authenticatedUser.id,
                        id_farm: id_farm
                    }
                });

                if (!newFarmAssociation) {
                    const response = ApiResponse.createApiResponse(
                        'Authorization failed',
                        [],
                        [{
                            msg: 'Owner does not have permission to move the module to farm ID ' + id_farm
                        }]
                    );
                    return res.status(403).json(response);
                }
            }

            if (users && users.length > 0) {
                const assignedUsers = await User.findAll({
                    where: {
                        id: users
                    }
                });

                if (assignedUsers.length !== users.length) {
                    const response = ApiResponse.createApiResponse(
                        'Validation failed',
                        [],
                        [{
                            msg: 'One or more users do not exist in the system'
                        }]
                    );
                    return res.status(400).json(response);
                }

                for (const user of assignedUsers) {
                    if (user.id_rol !== ROLES.MONITOR) {
                        const response = ApiResponse.createApiResponse(
                            'Authorization failed',
                            [],
                            [{
                                msg: `User with ID ${user.id} has role ${user.id_rol}, but only users with MONITOR role (${ROLES.MONITOR}) can be assigned to modules`
                            }]
                        );
                        return res.status(403).json(response);
                    }
                }
            }

            next();
        } catch (error) {
            console.error('Module update validation error:', error);
            const response = ApiResponse.createApiResponse(
                'Server error',
                [],
                [{
                    msg: 'Error validating module update permissions: ' + error.message
                }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleUpdateMiddleware;