const {ROLES: Role} = require("../enums/roles.enum");
const ApiResponse = require("../utils/apiResponse");

class ValidateUserUpdateMiddleware {

    async validateUserUpdate(req, res, next) {
        try {
            const { id_rol } = req.body;
            const idRolToUpdate = parseInt(id_rol);
            const authenticatedUser = req.user;

            if (authenticatedUser.id_rol === Role.ADMIN) {
                if (idRolToUpdate !== Role.ADMIN && idRolToUpdate !== Role.OWNER) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'Admins can only edit Admins or Owners roles'
                        }])
                    );
                }
            }

            if (authenticatedUser.id_rol === Role.OWNER) {
                if (idRolToUpdate !== Role.USER) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'Owners can only edit Users roles'
                        }])
                    );
                }
            }

            next();

        } catch (error) {
            console.error('User update validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error', [], [{
                    'error': 'Error validating user update role'
                }])
            );
        }
    }
}

module.exports = ValidateUserUpdateMiddleware;