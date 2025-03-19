const {ROLES: Role} = require("../enums/roles.enum");
const ApiResponse = require("../utils/apiResponse");

class ValidateUserCreationMiddleware {
    constructor() {
    }

    async validateUserCreation(req, res, next) {
        try {
            const { id_rol } = req.body;
            const idRolNewUSer = parseInt(id_rol);
            const authenticatedUser = req.user;

            if (authenticatedUser.id_rol === Role.ADMIN) {
                if (idRolNewUSer !== Role.ADMIN && idRolNewUSer !== Role.OWNER) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'Admins can only create Admins or Owners'
                        }])
                    );
                }
            }

            if( authenticatedUser.id_rol === Role.OWNER) {
                if (idRolNewUSer !== Role.MONITOR) {
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