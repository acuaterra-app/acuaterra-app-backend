const ApiResponse = require("../../utils/apiResponse");

class FarmOwnerController {

    /**
     *
     * @param {FarmOwnerService} farmOwnerService
     */
    constructor(farmOwnerService) {
        this.farmOwnerService = farmOwnerService;
    }

    async index(req, res) {
        try {
            const userId = req.user.id;
            const page = req.query.page;
            const limit = req.query.limit;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            
            const result = await this.farmOwnerService.findFarmsByUserId(userId, page, limit, sortField, sortOrder);
            
            const paginationMeta = {
                pagination: {
                    total: result.count,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    perPage: result.perPage,
                    hasNext: result.currentPage < result.totalPages,
                    hasPrev: result.currentPage > 1
                }
            };
            
            const response = ApiResponse.createApiResponse(
                "User farms retrieved successfully", 
                result.rows,
                [],
                paginationMeta
            );
            
            return res.json(response);
        } catch (error) {
            console.error("Error retrieving user farms:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve user farms", 
                [], 
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = FarmOwnerController;

