const { param, query } = require('express-validator');
const { Sensor } = require('../../../models');

const validateGetModulesByFarm = [
    param('farmId')
        .notEmpty()
        .withMessage('Farm ID is required')
        .isInt({ min: 1 })
        .withMessage('Farm ID must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Limit must be an integer between 1 and 500')
        .toInt()
];

const validateGetMeasurementsByModule = [
    param('moduleId')
        .notEmpty()
        .withMessage('Module ID is required')
        .isInt({ min: 1 })
        .withMessage('Module ID must be a positive integer'),

    query('startDate')
        .optional()
        .isDate()
        .withMessage('Start date must have a valid format (YYYY-MM-DD)'),

    query('endDate')
        .optional()
        .isDate()
        .withMessage('End date must have a valid format (YYYY-MM-DD)')
        .custom((value, { req }) => {
            if (req.query.startDate && value) {
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(value);

                if (endDate < startDate) {
                    throw new Error('End date must be after start date');
                }
            }
            return true;
        }),

    query('period')
        .optional()
        .isIn(['daily', 'weekly', 'monthly'])
        .withMessage('Period must be one of the following: daily, weekly, monthly'),

    query('sensorType')
        .optional()
        .isString()
        .withMessage('Sensor type must be a string')
        .custom(async (value) => {
            if (value) {
                const sensors = await Sensor.findAll({
                    attributes: ['type'],
                    group: ['type'],
                    where: { isActive: true }
                });

                const validTypes = sensors.map(sensor => sensor.type);

                if (!validTypes.includes(value)) {
                    throw new Error(`Invalid sensor type. Valid types: ${validTypes.join(', ')}`);
                }
            }
            return true;
        }),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Limit must be an integer between 1 and 500')
        .toInt()
];

module.exports = {
    validateGetModulesByFarm,
    validateGetMeasurementsByModule
};