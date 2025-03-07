const ROLES = require("../enums/roles.enum");
const ApiResponse = require("../utils/apiResponse");

class ValidateUserCreationMiddleware {
    constructor() {
    }

    async validateUserCreation(req, res, next) {
        try {
            const { id_rol: idRolNewUSer } = req.body;
            const authenticatedUser = req.user;

            if (authenticatedUser.id_rol === ROLES.ROLES.ADMIN) {
                if (idRolNewUSer !== ROLES.ROLES.ADMIN && idRolNewUSer !== ROLES.ROLES.OWNER) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'Admins can only create Admins or Owners'
                        }])
                    );
                }
            }

            if( authenticatedUser.id_rol === ROLES.ROLES.OWNER) {
                if (idRolNewUSer !== ROLES.ROLES.USER) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'Owners can only create Users'
                        }])
                    );
                }
            }

            next();

        } catch (error) {
            console.error('User creation validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error', [], [{
                    'error': 'Error validating user creation role'
                }])
            );
        }
    }
}

module.exports = ValidateUserCreationMiddleware;