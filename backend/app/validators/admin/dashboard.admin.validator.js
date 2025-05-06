const { query } = require('express-validator');

const validateNotificationStats = [
    query('farmId')
        .optional()
        .isInt()
        .withMessage('Farm ID must be an integer'),

    query('moduleIds')
        .optional()
        .isString()
        .withMessage('Module IDs must be a comma-separated string'),

    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO8601 format'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO8601 format'),

    query('groupBy')
        .optional()
        .isIn(['weekly', 'monthly'])
        .withMessage('Grouping must be either "weekly" or "monthly"')
];

module.exports = {
    validateNotificationStats
};