const ApiResponse = require('../../utils/apiResponse');
const ThresholdService = require('../../services/shared/threshold.shared.service');

class ThresholdController {
    constructor() {
        this.thresholdService = new ThresholdService();
    }

    async create(req, res) {
        try {

            const thresholdData = req.body;

            if (!thresholdData.id) {
                throw new Error('Sensor ID is required');
            }

            if (thresholdData.type !== 'min' && thresholdData.type !== 'max') {
                throw new Error('Invalid threshold type. Must be "min" or "max"');
            }

            const newThreshold = await this.thresholdService.create(thresholdData);

            const response = ApiResponse.createApiResponse("Threshold created successfully",
                [newThreshold],
                [])
            return res.status(201).json(response);
        } catch (error) {
            console.error('Error creating threshold:', error);

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('A threshold with these parameters already exists');
            }

            if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new Error('Invalid sensor ID');
            }

            const response = ApiResponse.createApiResponse('Error creating threshold',
                [],
                [{
                    msg: error.message
                }]);
            return res.status(500).json(response);
        }
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const options = {
                limit: parseInt(limit),
                offset: (page - 1) * limit
            };
            const thresholds = await this.thresholdService.findAll(options);
            return ApiResponse.createApiResponse('Thresholds retrieved successfully',
                [thresholds],
                []
            );
        } catch (error) {
            const response = ApiResponse.createApiResponse( 'Error retrieving thresholds',
                [],
                [{
                    msg: 'Error retrieving thresholds.',
                }]);
            return res.status(500).json(response);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const thresholdData = req.body;

            const updated = await this.thresholdService.update(id, thresholdData);

            if (!updated) {
                throw new Error('Threshold not found');
            }

            const updatedThreshold = await this.thresholdService.findOne({ where: { id } });
            return ApiResponse.createApiResponse('Threshold updated successfully',
                [updatedThreshold],
                []);
        } catch (error) {
            const response = ApiResponse.createApiResponse( 'Error retrieving thresholds',
                [],
                [{
                    msg: 'Error retrieving thresholds.',
                }])
            return res.status(500).json(response);
        }
    }
}

module.exports = ThresholdController;