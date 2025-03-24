const { Farm, User } = require('../../models');
const ApiResponse = require("../utils/apiResponse");
const { Op } = require('sequelize');

class ValidateModuleAccessMiddleware {

    async validateOwnerFarmAccess(req, res, next) {
        try {
            const authenticatedUser = req.user;

            const userFarms = await Farm.findAll({
                include: [
                    {
                        model: User,
                        as: 'users',
                        required: true,
                        where: {
                            [Op.or]: [
                                { id: authenticatedUser.id }
                            ]
                        },
                        through: {
                            attributes: []
                        }
                    }
                ]
            });

            if (!userFarms || userFarms.length === 0) {
                return res.status(403).json(
                    ApiResponse.createApiResponse('Authorization failed',
                        [],
                        [{
                            msg: 'No farms with associated monitor users were found.'
                        }]
                    )
                );
            }

            // Almacenar las granjas asociadas en el objeto request
            req.userFarms = userFarms;
            next();
        } catch (error) {
            console.error('Owner farm access validation error:', error);
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