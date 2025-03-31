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
                const response = ApiResponse.createApiResponse('User not found', [], [{ msg: 'User not found' }])
                return res.status(404).json(response);
            }

            let contact;
            try {
                contact = JSON.parse(user.contact);
            } catch (e) {
                const response = ApiResponse.createApiResponse('Invalid contact information', [], [{ msg: 'Invalid contact information' }])
                return res.status(400).json(response);
            }

            if (!contact || contact.type !== 'sensor' || !contact.moduleId) {
                const response = ApiResponse.createApiResponse('Invalid sensor configuration', [], [{ msg: 'Invalid sensor configuration' }])
                return res.status(400).json(response);
            }

            const moduleId = contact.moduleId;
            const module = await Module.findByPk(moduleId);

            if (!module) {
                const response = ApiResponse.createApiResponse('Module not found', [], [{ msg: 'Module not found' }])
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
            let errorMessage = 'Error creating measurement';

            if (statusCode === 400) {
                errorMessage = 'Invalid measurement data';
            } else if (statusCode === 401) {
                errorMessage = 'Authentication required';
            } else if (statusCode === 403) {
                errorMessage = 'Not authorized to create measurements';
            } else if (statusCode === 404) {
                errorMessage = 'Required resource not found';
            }

            const response = ApiResponse.createApiResponse(errorMessage, [], [{ msg: error.message || 'Internal server error' }]);
            res.status(statusCode).json(response);
        }
    }

    async getMeasurementsByModule(req, res) {
        try {
            const userId = req.user.id;
            const sensorId = req.query.sensorId;

            if (!userId) {
                const response = ApiResponse.createApiResponse('User ID is required', [], [{ msg: 'User ID is required' }])
                return res.status(401).json(response);
            }

            const result = await this.measurementService.getMeasurementsByOwnerModule(userId, sensorId);

            if (result.success) {
                const response = ApiResponse.createApiResponse(result.message, result.data, []);

                if (!result.data || result.data.length === 0) {
                    return res.status(204).json(response);
                }

                return res.status(200).json(response);
            } else {
                let statusCode = 500;
                if (result.error && result.error.includes('not found')) {
                    statusCode = 404;
                } else if (result.error && (result.error.includes('invalid') || result.error.includes('required'))) {
                    statusCode = 400;
                } else if (result.error && (result.error.includes('permission') || result.error.includes('authorized'))) {
                    statusCode = 403;
                }
                const response = ApiResponse.createApiResponse('Error retrieving measurements', [], [{ msg: result.error || result.message || 'Error retrieving measurements' }])
                return res.status(statusCode).json(response);
            }
        } catch (error) {
            const statusCode = error.statusCode || 500;
            let errorMessage = 'Error retrieving measurements';

            if (statusCode === 400) {
                errorMessage = 'Invalid request parameters';
            } else if (statusCode === 401) {
                errorMessage = 'Authentication required';
            } else if (statusCode === 403) {
                errorMessage = 'Not authorized to view these measurements';
            } else if (statusCode === 404) {
                errorMessage = 'Requested measurements not found';
            }
            const  response = ApiResponse.createApiResponse(errorMessage, [], [{ msg: error.message || 'Internal server error' }])
            return res.status(statusCode).json(response);
        }
    }
}

module.exports = MeasurementController;