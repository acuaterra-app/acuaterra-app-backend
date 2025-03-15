const { ROLES: Role } = require("../enums/roles.enum");
const ApiResponse = require("../utils/apiResponse");

class ValidateUserDeleteMiddleware {
    async validate(req, res, next) {
        try {
            const userIdToDelete = parseInt(req.params.id);
            const authenticatedUser = req.user;

            if (authenticatedUser.id === userIdToDelete) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed', [], [{
                        'error': 'You cannot delete your own account'
                    }])
                );
            }

            if (authenticatedUser.id_rol === Role.USER) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed', [], [{
                        'error': 'You do not have permission to delete users'
                    }])
                );
            }

            const { User } = require('../../models');
            const userToDelete = await User.findByPk(userIdToDelete);

            if (!userToDelete) {
                return res.status(404).json(
                    ApiResponse.createApiResponse('User not found', [], [{
                        'error': 'User to delete was not found'
                    }])
                );
            }


            if (authenticatedUser.id_rol === Role.ADMIN && userToDelete.id_rol === Role.ADMIN) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed', [], [{
                        'error': 'An administrator cannot delete another administrator'
                    }])
                );
            }

            if (authenticatedUser.id_rol === Role.OWNER &&
                (userToDelete.id_rol === Role.ADMIN || userToDelete.id_rol === Role.OWNER)) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed', [], [{
                        'error': 'An owner can only delete users with USER role'
                    }])
                );
            }

            next();
        } catch (error) {
            console.error('User deletion validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error', [], [{
                    'error': 'Error validating permissions to delete user'
                }])
            );
        }
    }
}

module.exports = ValidateUserDeleteMiddleware;