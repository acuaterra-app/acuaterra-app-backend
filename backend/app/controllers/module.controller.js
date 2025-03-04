const ApiResponse = require("../utils/apiResponse");

class ModuleController {

    /**
     *
     * @param {ModuleService} moduleService
     */
    constructor(moduleService) {
        this.moduleService = moduleService;
    }

    async index(req, res) {
        try {
            const farmId = req.params.farm_id;
            const page = req.query.page;
            const limit = req.query.limit;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            
            const result = await this.moduleService.findAll(farmId, page, limit, sortField, sortOrder);
            
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
                "All modules retrieved successfully", 
                result.rows,
                [],
                paginationMeta
            );
            
            return res.json(response);
        } catch (error) {
            console.error("Error retrieving modules:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve modules", 
                [], 
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ModuleController;

