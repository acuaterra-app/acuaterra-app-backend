const { query } = require("express-validator");
const { NOTIFICATION_STATE, isValidState } = require("../../enums/notification-state.enum");

/**
 * Validates query parameters for notification listing
 */
const validateNotificationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .default(1)
        .withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .default(10)
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),

    query('state')
        .optional()
        .custom((value) => {
            if (!value) return true; // Allow null/undefined
            return isValidState(value);
        })
        .withMessage(`State must be one of: ${Object.values(NOTIFICATION_STATE).join(', ')}`)
];

module.exports = { validateNotificationQuery };

