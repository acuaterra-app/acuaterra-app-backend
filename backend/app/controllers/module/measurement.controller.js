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
                throw new Error('User not found');
            }

            let contact;
            try {
                contact = JSON.parse(user.contact);
            } catch (e) {
                throw new Error('Invalid contact information');
            }

            if (!contact || contact.type !== 'sensor' || !contact.moduleId) {
                throw new Error('Invalid sensor configuration');
            }

            const moduleId = contact.moduleId;
            const module = await Module.findByPk(moduleId);
            if (!module) {
                throw new Error('Module not found');
            }

            const measurement = await this.measurementService.createMeasurement(
                req.body,
                moduleId
            );

            const response = ApiResponse.createApiResponse(
                'Measurement created successfully',
                [measurement],
                []
            );
            res.status(201).json(response);
        } catch (error) {
            console.error("Error creating measurement:", error);
            const statusCode = error.statusCode || 500;
            const response = ApiResponse.createApiResponse(
                'Error creating measurement',
                [],
                [{ msg: error.message }]
            );
            res.status(statusCode).json(response);
        }
    }
    async getMeasurementsByModule(req, res) {
        try {
            const userId = req.user.id;
            const sensorId = req.query.sensorId;

            const result = await this.measurementService.getMeasurementsByOwnerModule(userId, sensorId);

            if (result.success) {
                const response = ApiResponse.createApiResponse(
                    result.message,
                    result.data,
                    []
                );
                res.status(result.data.length > 0 ? 200 : 204).json(response);
            } else {
                const response = ApiResponse.createApiResponse(
                    result.message,
                    [],
                    [{ msg: result.error || result.message }]
                );
                res.status(result.data ? 404 : 500).json(response);
            }
        } catch (error) {
            console.error("Unexpected error in getMeasurementsByModule:", error);
            const response = ApiResponse.createApiResponse(
                'Unexpected error',
                [],
                [{ msg: 'Internal server error' }]
            );
            res.status(500).json(response);
        }
    }
}

module.exports = MeasurementController;