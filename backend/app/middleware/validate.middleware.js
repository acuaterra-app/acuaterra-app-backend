const ApiResponse = require('../utils/apiResponse');

const validateMiddleware = validations => {
    return async (req, res, next) => {
        for (const validation of validations) {

            const result = await validation.run(req);

            if (!result.isEmpty()) {
                return res.status(400).json(ApiResponse.createApiResponse('Request error', [], result.array()));
            }

        }
        next();
    };

};

module.exports = { validate: validateMiddleware };