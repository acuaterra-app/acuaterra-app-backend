const { Farm } = require('../../models');
const ApiResponse = require('../utils/ApiResponse');

class ValidateModuleCreateMiddleware {
    async validateModuleCreation(req, res, next) {
        try {
            const userId = req.user.id;
            const farmId = req.body.id_farm;

            if (!farmId) {
                const response = ApiResponse.createApiResponse('Farm ID is required',
                    [],
                    [{
                        msg: 'Please enter a valid farm',
                    }])
                return res.status(400).json(response);
            }

            const farm = await Farm.findOne({
                where: { 
                    id: farmId
                }
            });

            if (!farm) {
                const  response = ApiResponse.createApiResponse('The user does not have permissions to create modules on this farm',
                    [],
                    [{
                        msg: 'Unauthorized farm access',
                    }])
                return res.status(403).json(response);
            }

            next();
        } catch (error) {
            console.error('Error in module creation validation:', error);
            const response = ApiResponse.createApiResponse('Error creating module creation',
                [],
                [{
                    msg: error.message,
                }])
                return res.status(500).json(response);
        }
    }
}

module.exports = ValidateModuleCreateMiddleware;

