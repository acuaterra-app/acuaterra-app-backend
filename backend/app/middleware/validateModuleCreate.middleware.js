const { Farm } = require('../../models');
const ApiResponse = require('../utils/ApiResponse');

class ValidateModuleCreateMiddleware {
    async validateModuleCreation(req, res, next) {
        try {
            const id_user = req.user.id;
            const id_farm = req.body.id_farm;

            if (!id_farm) {
                const response = ApiResponse.createApiResponse('Farm ID is required',
                    [],
                    [{
                        msg: 'Please enter a valid farm',
                    }])
                return res.status(400).json(response);
            }

            const farm = await Farm.findOne({
                where: {
                    id: id_farm
                }
            });

            if (!farm) {
                const response = ApiResponse.createApiResponse('Farm not found',
                    [],
                    [{
                        msg: 'The specified farm does not exist',
                    }])
                return res.status(404).json(response);
            }

            const userFarmAssociation = await FarmUser.findOne({
                where: {
                    id_user: id_user,
                    id_farm: id_farm
                }
            });

            if (!userFarmAssociation) {
                const response = ApiResponse.createApiResponse('The user does not have permissions to create modules on this farm',
                    [],
                    [{
                        msg: 'Unauthorized farm access',
                    }])
                return res.status(403).json(response);
            }

            next();
        } catch (error) {
            console.error('Error in module creation validation:', error);
            const response = ApiResponse.createApiResponse('Error creating module',
                [],
                [{
                    msg: error.message,
                }])
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleCreateMiddleware;