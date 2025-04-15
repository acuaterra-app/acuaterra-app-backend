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
                users = []
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
                users,
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

    async show(req, res) {
        try {
            const { id } = req.params;
            const module = await this.moduleOwnerService.getById(id);
            
            const response = ApiResponse.createApiResponse(
                "Module details retrieved successfully",
                [module],
                []
            );
            return res.status(200).json(response);
        } catch (error) {
            console.error("Error retrieving module details:", error);
            const response = ApiResponse.createApiResponse(
                "Failed to retrieve module details",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            } else if (error.message.includes("permission") || error.message.includes("Forbidden")) {
                return res.status(403).json(response);
            }

            return res.status(500).json(response);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const moduleData = req.body;
            const result = await this.moduleOwnerService.update(id, moduleData);
            const response = ApiResponse.createApiResponse('Successful update.',
                [result],
                [])
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error update module controller:', error);
            const response = ApiResponse.createApiResponse('Failed to update module',
                [],
                [{ msg: error.message }])
            return res.status(400).json(response);
        }
    }

    async delete(req, res) {
        try {
            const result = await this.moduleOwnerService.delete(req.params.id);
            const response = ApiResponse.createApiResponse(
                "Module deleted successfully",
                [result],
                []
            );
            return res.json(response);
        } catch (error) {
            console.error("Error deleting module:", error);
            const response = ApiResponse.createApiResponse(
                "Error deleting module",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            } else if (error.message.includes("permission") || error.message.includes("Forbidden")) {
                return res.status(403).json(response);
            }

            return res.status(500).json(response);
        }
    }

    async assignMonitor(req, res) {
        try {
            const { moduleId, monitorId } = req.params;
            const { action = 'assign' } = req.body;

            let result;
            if (action === 'assign') {
                result = await this.moduleOwnerService.assignMonitorToModule(moduleId, monitorId);
            } else if (action === 'unassign') {
                result = await this.moduleOwnerService.unassignMonitorFromModule(moduleId, monitorId);
            } else {
                throw new Error('Invalid action. Must be "assign" or "unassign"');
            }

            const response = ApiResponse.createApiResponse(
                `Monitor ${action === 'assign' ? 'assigned to' : 'unassigned from'} module successfully`,
                [result],
                []
            );
            return res.status(200).json(response);
        } catch (error) {
            console.error("Error in monitor assignment:", error);
            const response = ApiResponse.createApiResponse(
                "Error in monitor assignment",
                [],
                [{ msg: error.message }]
            );

            if (error.message.includes("not found")) {
                return res.status(404).json(response);
            } else if (error.message.includes("already assigned")) {
                return res.status(409).json(response);
            } else if (error.message.includes("not assigned")) {
                return res.status(404).json(response);
            }

            return res.status(500).json(response);
        }
    }
}

module.exports = ModuleOwnerController;