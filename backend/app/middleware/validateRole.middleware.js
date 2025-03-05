const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const ROLES = require('../enums/roles.enum');
const { User } = require('../../models');

class ValidateRoleMiddleware {
    constructor() {
    }
    validate(roles) {
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization;

                if (!token) {
                    return res.status(401).json(ApiResponse.createApiResponse('Authentication failed', [], [{
                        'error': 'Invalid token format'
                    }]));
                }
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                if (!decoded) {
                    return res.status(401).json(ApiResponse.createApiResponse('Authentication failed', [], [{
                        'error': 'Failed to authenticate token'
                    }]));
                }

                const user = await User.findByPk(decoded.id);
                
                if (!user) {
                    return res.status(404).json(ApiResponse.createApiResponse('Authentication failed', [], [{
                        'error': 'Token mal formed'
                    }]));
                }
                
                const allowedRoles = Array.isArray(roles) ? roles : [roles];
                
                const validRoles = Object.values(ROLES);
                const invalidRoles = allowedRoles.filter(role => !validRoles.includes(role));
                
                if (invalidRoles.length > 0) {
                    return res.status(400).json(
                        ApiResponse.createApiResponse('Validation failed', [], [{
                            'error': `Invalid role(s) provided: ${invalidRoles.join(', ')}. Valid roles are: ${Object.keys(ROLES).join(', ')}`
                        }])
                    );
                }
                console.log('Allowed roles:', allowedRoles);
                console.log('User role:', user.id_rol);
                console.log('Does user have permission?', allowedRoles.includes(user.id_rol));

                const hasPermission = allowedRoles.includes(Number(user.id_rol));
                
                if (!hasPermission) {
                    return res.status(403).json(
                        ApiResponse.createApiResponse('Authorization failed', [], [{
                            'error': 'You do not have permission to access this resource'
                        }])
                    );
                }

                req.user = user;
                
                next();
            } catch (error) {
                console.log('Role validation error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                return res.status(500).json(
                    ApiResponse.createApiResponse('Server error', [], [{
                        'error': 'Error validating user role'
                    }])
                );
            }
        };
    }

    async validateUserCreation(req, res, next) {
        try {
            const { id_rol } = req.body;
            const authenticatedUser = req.user;

            if (authenticatedUser.id_rol === ROLES.OWNER && id_rol !== ROLES.USER) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed', [], [{
                        'error': 'You do not have permission to access this resource '
                    }])
                );
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

module.exports = ValidateRoleMiddleware;

