const ApiResponse = require('../../utils/apiResponse');

class ModuleOwnerController {
    /**
     *
     * @param {ModuleOwnerService} moduleOwnerService
     */
    constructor(moduleOwnerService) {
        this.moduleOwnerService = moduleOwnerService;
    }

    async create(req, res) {
        try {
            const {
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
            } = req.body;

            const created_by_user_id = req.user.id;

            const newModule = await this.moduleOwnerService.create({
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                created_by_user_id
            });

            const response = ApiResponse.createApiResponse(
                "Module created successfully",
                [ newModule ]
            );
            return res.status(201).json(response);
        } catch (error) {
            console.error("Error creating module:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to create module",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ModuleOwnerController;