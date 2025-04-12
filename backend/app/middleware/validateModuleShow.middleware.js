const { Farm, User, Module } = require('../../models');
const ApiResponse = require("../utils/apiResponse");

class ValidateModuleShowMiddleware {
    async validate(req, res, next) {
        try {
            const moduleId = req.params.id;
            const authenticatedUser = req.user;

            const module = await Module.findOne({
                where: { id: moduleId },
                include: [{
                    model: Farm,
                    as: 'farm',
                    required: true,
                    include: [{
                        model: User,
                        as: 'users',
                        where: { id: authenticatedUser.id },
                        through: { attributes: [] }
                    }]
                }]
            });

            if (!module) {
                return res.status(404).json(
                    ApiResponse.createApiResponse(
                        'Access denied',
                        [],
                        [{
                            msg: 'You do not have access to this module or it does not exist in your assigned farms'
                        }]
                    )
                );
            }

            next();
        } catch (error) {
            console.error('Error validating access to the module:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse(
                    'Server error',
                    [],
                    [{
                        msg: 'Error validating module access permissions'
                    }]
                )
            );
        }
    }
}

module.exports = ValidateModuleShowMiddleware;

