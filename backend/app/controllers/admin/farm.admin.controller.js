const ApiResponse = require("../../utils/apiResponse");

class FarmAdminController {

    /**
     *
     * @param {FarmAdminService} farmAdminService
     */
    constructor(farmAdminService) {
        this.farmAdminService = farmAdminService;
    }

    async index(req, res) {
        try {
            const page = req.query.page;
            const limit = req.query.limit;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            
            const result = await this.farmAdminService.findAll(page, limit, sortField, sortOrder);
            
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
                "Farms retrieved successfully", 
                result.rows,
                [],
                paginationMeta
            );
            
            return res.json(response);
        } catch (error) {
            console.error("Error retrieving farms:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve farms", 
                [], 
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async create(req, res) {
        try {
            const { name, address, latitude, longitude, users = [] } = req.body;
            
            const newFarm = await this.farmAdminService.create({
                name,
                address,
                latitude,
                longitude,
                users
            });

            const response = ApiResponse.createApiResponse(
                "Farm created successfully", 
                [ newFarm ]
            );
            return res.status(201).json(response);
        } catch (error) {
            console.error("Error creating farm:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to create farm", 
                [], 
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const farm = await this.farmAdminService.findById(id);
            
            const response = ApiResponse.createApiResponse(
                "Farm retrieved successfully", 
                [ farm ]
            );
            return res.json(response);
        } catch (error) {
            console.error("Error retrieving farm:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve farm", 
                [], 
                [{ msg: error.message }]
            );
            
            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            }
            
            return res.status(500).json(response);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, address, latitude, longitude, users = [] } = req.body;
            
            const updatedFarm = await this.farmAdminService.update(id, {
                name,
                address,
                latitude,
                longitude,
                users
            });

            const response = ApiResponse.createApiResponse(
                "Farm updated successfully", 
                [ updatedFarm ]
            );
            return res.json(response);
        } catch (error) {
            console.error("Error updating farm:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to update farm", 
                [], 
                [{ msg: error.message }]
            );
            
            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            }
            
            return res.status(500).json(response);
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            await this.farmAdminService.delete(id);
            
            const response = ApiResponse.createApiResponse(
                "Farm deleted successfully", 
                [ {deleted_id: id} ]
            );
            return res.json(response);
        } catch (error) {
            console.error("Error deleting farm:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to delete farm", 
                [], 
                [{ msg: error.message }]
            );
            
            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            }
            
            return res.status(500).json(response);
        }
    }
}

module.exports = FarmAdminController;

