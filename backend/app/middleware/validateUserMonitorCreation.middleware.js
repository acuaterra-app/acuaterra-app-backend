const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../enums/roles.enum');

class ValidateUserMonitorCreationMiddleware {
    constructor() {}

    async validate(req, res, next) {
        try {
            if (req.body.id_rol && Number(req.body.id_rol) !== ROLES.MONITOR) {
                const response = ApiResponse.createApiResponse(
                    'Validation Error',
                    [],
                    [{
                        msg: 'The assigned role must be Monitor (3)'
                    }]
                )
                return res.status(400).json(response);
            }

            if (!req.body.id_rol) {
                req.body.id_rol = ROLES.MONITOR;
            }

            if (req.body && req.body.farm_id) {
                delete req.body.farm_id;
            }

            next();
        } catch (error) {
            console.error('Error in monitor creation validation:', error);
            const response = ApiResponse.createApiResponse(
                'Server Error',
                [],
                [{
                    msg: 'An error occurred while processing monitor user creation validation',
                    details: error.message
                }]
            )
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateUserMonitorCreationMiddleware;