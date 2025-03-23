const { ROLES } = require("../enums/roles.enum");
const { FarmUser, Module, Farm } = require('../../models');
const ApiResponse = require("../utils/apiResponse");

class ValidateModuleAccessMiddleware {

    async validate(req, res, next) {
        try {
            const moduleId = parseInt(req.params.id);
            const authenticatedUser = req.user;

            const module = await Module.findByPk(moduleId, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    }
                ]
            });

            if (!module) {
                return res.status(404).json(
                    ApiResponse.createApiResponse('Module not found',
                        [],
                        [{
                            msg: 'The requested module was not found'
                        }]
                    )
                );
            }

            const farmUserAssociation = await FarmUser.findOne({
                where: {
                    id_user: authenticatedUser.id,
                    id_farm: module.id_farm
                }
            });

            if (!farmUserAssociation || authenticatedUser.id_rol !== ROLES.OWNER) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed',
                        [],
                        [{
                            msg: 'You do not have permission to access modules in this farm'
                        }]
                    )
                );
            }

            req.module = module;

            next();
        } catch (error) {
            console.error('Module access validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error',
                    [],
                    [{
                        msg: 'Error validating permissions to access module'
                    }]
                )
            );
        }
    }
}

module.exports = ValidateModuleAccessMiddleware;