const { Farm, User, Module } = require('../../../models');
const ApiResponse = require("../../utils/apiResponse");
const { ROLES } = require('../../enums/roles.enum');
const { Op } = require('sequelize');

class ValidateOwnerMonitorAccessMiddleware {
    async validate(req, res, next) {
        try {
            if (req.user.id_rol === ROLES.OWNER) {
                const ownerId = req.user.id;

                const ownerFarms = await Farm.findAll({
                    where: { 
                        isActive: true 
                    },
                    include: [{
                        model: User,
                        as: 'users',
                        where: { 
                            id: ownerId,
                            isActive: true 
                        },
                        through: { attributes: [] }
                    }]
                });

                if (!ownerFarms || ownerFarms.length === 0) {
                    const response = ApiResponse.createApiResponse(
                            'He has no access to any farm',
                            [],
                            [{
                                msg: 'Has no farms assigned or active'
                            }])
                    return res.status(403).json(response);
                }

                req.ownerFarmIds = ownerFarms.map(farm => farm.id);
            }
            
            next();
        } catch (error) {
            console.error('Error in access validation to monitors:', error);
            const response = ApiResponse.createApiResponse(
                'Server error',
                [],
                [{
                    msg: 'Error validating access permissions'
                }]
            )
            return res.status(500).json(response);
        }
    }
}

module.exports = ValidateOwnerMonitorAccessMiddleware;

