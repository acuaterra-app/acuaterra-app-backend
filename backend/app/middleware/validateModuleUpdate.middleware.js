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
                        msg: 'You do not have permission to update modules in this farm'
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
                            msg: 'You do not have permission to move the module to the specified farm'
                        }]
                    );
                    return res.status(403).json(response);
                }
            }

            if (users && users.length > 0) {
                const monitorUsers = await User.findAll({
                    where: {
                        id: users
                    },
                    include: [{
                        model: FarmUser,
                        where: {
                            id_farm: id_farm || module.id_farm
                        },
                        required: true
                    }]
                });

                if (monitorUsers.length !== users.length) {
                    const response = ApiResponse.createApiResponse(
                        'Authorization failed',
                        [],
                        [{
                            msg: 'Some users are not associated with the farm or do not exist'
                        }]
                    );
                    return res.status(403).json(response);
                }

                for (const user of monitorUsers) {
                    if (user.id_rol !== ROLES.MONITOR) {
                        const response = ApiResponse.createApiResponse(
                            'Authorization failed',
                            [],
                            [{
                                msg: 'Only monitor users can be assigned to modules'
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
                    msg: 'Error validating module update permissions'
                }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleUpdateMiddleware;

