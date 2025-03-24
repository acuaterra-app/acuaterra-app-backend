const UserService = require('../../services/shared/user.service');
const ApiResponse = require('../../utils/apiResponse');
const { ROLES } = require('../../enums/roles.enum');

class userOwnerController {
    constructor(userService) {
        this.userService = userService;
    }

    async index(req, res) {
        try {
            const page = req.query.page;
            const limit = req.query.limit;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;

            const roles = [ROLES.MONITOR];

            const result = await this.userService.getAllUsers(page, limit, sortField, sortOrder, roles);

            const paginationMeta = {
                pagination:{
                    total: result.count,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    perPage: result.perPage,
                    hasNext: result.currentPage < result.totalPages,
                    hasPrev: result.currentPage > 1
                }
            }

            const response = ApiResponse.createApiResponse(
                "Monitor users successfully recovered",
                result.rows,
                [],
                paginationMeta
            );

            return res.json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Error retrieving monitor users",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = userOwnerController;