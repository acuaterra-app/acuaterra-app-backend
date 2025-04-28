const ApiResponse = require('../../utils/apiResponse');

class ModuleAdminController {
    constructor(moduleAdminService) {
        this.moduleAdminService = moduleAdminService;
    }

    async getModulesByFarm(req, res) {
        try {
            const farmId = req.params.farmId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;

            const result = await this.moduleAdminService.getModulesByFarmId(farmId, limit);

            if (!result.success) {
                const response = ApiResponse.createApiResponse(
                    result.message,
                    [],
                    [{msg: result.message}]
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.createApiResponse(
                result.message,
                result.data,
                []
            );

            return res.status(200).json(response);
        } catch (error) {
            console.error(`Error in getModulesByFarm: ${error.message}`);
            const response = ApiResponse.createApiResponse(
                'Error retrieving modules',
                [],
                [{msg: error.message || 'Internal server error'}]
            );
            return res.status(500).json(response);
        }
    }


    async getMeasurementsByModule(req, res) {
        try {
            const moduleId = req.params.moduleId;
            const {
                startDate,
                endDate,
                period,
                sensorType,
                limit
            } = req.query;

            const result = await this.moduleAdminService.getMeasurementsByModuleId(moduleId, {
                startDate,
                endDate,
                period,
                sensorType,
                limit: limit ? parseInt(limit) : undefined
            });

            if (!result.success) {
                const response = ApiResponse.createApiResponse(
                    result.message,
                    [],
                    [{msg: result.message}]
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.createApiResponse(
                result.message,
                result.data,
                []
            );

            return res.status(200).json(response);
        } catch (error) {
            console.error(`Error in getMeasurementsByModule: ${error.message}`);
            const response = ApiResponse.createApiResponse(
                'Error retrieving measurements',
                [],
                [{msg: error.message || 'Internal server error'}]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = ModuleAdminController;

