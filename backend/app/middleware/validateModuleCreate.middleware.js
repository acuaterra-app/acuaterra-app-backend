const { FarmUser, User } = require('../../models');
const { ROLES } = require('../enums/roles.enum');
const ApiResponse = require('../utils/apiResponse');

class ValidateModuleCreateMiddleware {
    async validate(req, res, next) {
        try {
            const authenticatedUser = req.user;
            const { id_farm, users } = req.body;

            const farmUserAssociation = await FarmUser.findOne({
                where: {
                    id_user: authenticatedUser.id,
                    id_farm: id_farm
                }
            });

            if (!farmUserAssociation) {
                    const response = ApiResponse.createApiResponse('Authorization failed',
                        [],
                        [{
                            msg: 'You do not have permission to create modles in this farm'
                        }]
                );
                return res.status(403).json(response);
            }

            if (users && users.length > 0) {
                const monitorUsers = await User.findAll({
                    where: {
                        id: users
                    }
                });

                for (const user of monitorUsers) {
                    if (user.id_rol !== ROLES.USER) {
                            const response = ApiResponse.createApiResponse('Authorization failed', [], [{
                                msg: 'Only monitor users can be asigned to modules'
                            }]
                        );
                    return res.status(403).json(response);
                    }
                }

            }

            next();
        } catch (error) {
            console.error('Module creation validation error:', error);
            const response =
                ApiResponse.createApiResponse('Server error',
                    [],
                    [{
                        msg: 'Error validating module creation permisions'
                    }])
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleCreateMiddleware;