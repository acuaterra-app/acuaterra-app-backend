const { Farm, User, Module } = require('../../../models');
const ApiResponse = require("../../utils/apiResponse");
const { Op } = require('sequelize');

class ValidateModuleAccessMiddleware {

    async validateOwnerModuleAccess(req, res, next) {
        try {
            const ownerId = req.user.id;

            const ownerModules = await Module.findAll({
                where: { isActive: true },
                include: [{
                    model: Farm,
                    as: 'farm',
                    where: { isActive: true },
                    include: [{
                        model: User,
                        as: 'users',
                        required: true,
                        where: { 
                            id: ownerId,
                            isActive: true 
                        },
                        through: { attributes: [] }
                    }]
                }]
            });

            if (!ownerModules || ownerModules.length === 0) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed',
                        [],
                        [{
                            msg: 'You do not have access to any modules through your farms.'
                        }]
                    )
                );
            }

            req.ownerModules = ownerModules;
            
            req.ownerModuleIds = ownerModules.map(module => module.id);
            
            next();
        } catch (error) {
            console.error('Owner module access validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error',
                    [],
                    [{
                        msg: 'Error validating access permissions'
                    }]
                )
            );
        }
    }
}

module.exports = ValidateModuleAccessMiddleware;