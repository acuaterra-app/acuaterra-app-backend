const ApiResponse = require('../../utils/apiResponse');
const { Module, User } = require('../../../models');

class MeasurementController {

    constructor(measurementService) {
        this.measurementService = measurementService;
    }

    async createMeasurement(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                const response = ApiResponse.createApiResponse('User not found', [], [{msg: 'User not found'}])
                return res.status(404).json(response);
            }

            let contact;
            try {
                contact = JSON.parse(user.contact);
            } catch (e) {
                const response = ApiResponse.createApiResponse('Invalid contact information', [], [{msg: 'Invalid contact information'}])
                return res.status(400).json(response);
            }

            if (!contact || contact.type !== 'sensor' || !contact.moduleId) {
                const response = ApiResponse.createApiResponse('Invalid sensor configuration', [], [{msg: 'Invalid sensor configuration'}])
                return res.status(400).json(response);
            }

            const moduleId = contact.moduleId;
            const module = await Module.findByPk(moduleId);

            if (!module) {
                const response = ApiResponse.createApiResponse('Module not found', [], [{msg: 'Module not found'}])
                return res.status(404).json(response);
            }

            if (req.thresholdInfo) {
                req.body.thresholdInfo = req.thresholdInfo;
            }

            const measurement = await this.measurementService.createMeasurement(req.body, moduleId);

            let message = 'Measurement created successfully';
            let statusCode = 201;

            if (req.thresholdInfo && !req.thresholdInfo.isWithinThreshold) {
                message = 'Measurement created and alert generated';
                statusCode = 202;
            }

            const response = ApiResponse.createApiResponse(message, [measurement], []);
            res.status(statusCode).json(response);

        } catch (error) {
            const statusCode = error.statusCode || 500;
            const response = ApiResponse.createApiResponse(
                'Error creating measurement',
                [],
                [{msg: error.message || 'Internal server error'}]
            );

            res.status(statusCode).json(response);
        }
    }

    async getMeasurementsByModule(req, res) {
        try {
            const userId = req.user.id;
            const sensorId = req.query.sensorId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;

            const result = await this.measurementService.getMeasurementsByOwnerModule(userId, sensorId, limit);

            if (!result.success) {
                console.error(`Service error: ${result.message}`);
                const response = ApiResponse.createApiResponse(
                    'Error retrieving measurements',
                    [],
                    [{msg: result.message || 'Unknown error'}]
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.createApiResponse(
                result.message || 'Measurements retrieved',
                result.data,
                []
            );

            const statusCode = result.data?.length ? 200 : 204;
            return res.status(statusCode).json(response);

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

module.exports = MeasurementController;