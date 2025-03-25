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
}

module.exports = MeasurementController;