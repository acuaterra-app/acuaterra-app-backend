const { ROLES } = require("../../enums/roles.enum");
const { FarmUser, Module, Farm } = require('../../../models');
const ApiResponse = require("../../utils/apiResponse");

class ValidateModuleDeleteMiddleware {
    async validate(req, res, next) {
        try {
            const moduleIdToDelete = parseInt(req.params.id);
            const authenticatedUser = req.user;

            const moduleToDelete = await Module.findByPk(moduleIdToDelete, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    }
                ]
            });

            if (!moduleToDelete) {
                return res.status(404).json(
                    ApiResponse.createApiResponse('Module not found',
                        [],
                        [{
                        msg: 'Module to delete was not found'
                    }])
                );
            }

            const farmUserAssociation = await FarmUser.findOne({
                where: {
                    id_user: authenticatedUser.id,
                    id_farm: moduleToDelete.id_farm
                }
            });

            if (!farmUserAssociation) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed',
                        [],
                        [{
                        msg: 'You do not have permission to delete modules in this farm'
                    }])
                );
            }

            req.moduleToDelete = moduleToDelete;

            next();
        } catch (error) {
            console.error('Module deletion validation error:', error);
            return res.status(500).json(
                ApiResponse.createApiResponse('Server error',
                    [],
                    [{
                    msg: 'Error validating permissions to delete module'
                }])
            );
        }
    }
}

module.exports = ValidateModuleDeleteMiddleware;