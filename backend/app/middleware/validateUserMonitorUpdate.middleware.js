const { User, Farm, Module, sequelize } = require('../../models');
const ApiResponse = require('../utils/apiResponse');

class ValidateUserMonitorUpdateMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            const userId = req.params.id;
            const loggedUserId = req.user.id;

            const userToUpdate = await User.findOne({
                where: {
                    id: userId,
                    isActive: true
                }
            });

            if (!userToUpdate) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{ msg: `User with id ${userId} not found in the system or is inactive` }]
                )
                return res.status(404).json(response);
            }
            next();
        } catch (error) {
            console.error('Monitor update validation error:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'Error processing monitor user validation',
                    details: error.message
                }]
            )
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateUserMonitorUpdateMiddleware;