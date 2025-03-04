const { body, query } = require('express-validator');
const { User } = require('../../models');
const ROLES = require('../enums/roles.enum');

const validateFarmCreation = [
    body('name')
        .notEmpty().withMessage('Farm name is required')
        .isString().withMessage('Name must be a string')
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('address')
        .notEmpty().withMessage('Farm address is required')
        .isString().withMessage('Address must be a string')
        .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),

    body('latitude')
        .notEmpty()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid number between -90 and 90'),

    body('longitude')
        .notEmpty()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid number between -180 and 180'),

    body('users')
        .notEmpty().withMessage('At least one user must be assigned to the farm')
        .isArray().withMessage('Users must be an array')
        .custom(async (users) => {
            if (!users || !users.length) {
                throw new Error('At least one user must be assigned to the farm');
            }

            const uniqueUserIds = new Set(users);
            for (const userId of uniqueUserIds) {
                const numericUserId = Number(userId);

                if (isNaN(numericUserId)) {
                    throw new Error(`User ID "${userId}" is not a valid number`);
                }
                
                const user = await User.findByPk(numericUserId);
                if (!user) {
                    throw new Error(`User with ID ${numericUserId} does not exist`);
                }
                
                if (user.id_rol !== ROLES.OWNER) {
                    throw new Error(`User with ID ${numericUserId} has role ${user.id_rol}. Only users with OWNER role (${ROLES.OWNER}) can be assigned to a farm`);
                }
            }
            return true;
        }),
    ];

const validateFarmUpdate = [
    body('name')
        .optional()
        .isString().withMessage('Name must be a string')
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),

    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid number between -90 and 90'),

    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid number between -180 and 180'),

    body('users')
        .optional()
        .isArray().withMessage('Users must be an array')
        .custom(async (users) => {
            if (!users || !users.length) {
                return true; // Users array is optional for updates
            }

            const uniqueUserIds = new Set();
            for (const userId of users) {
                const numericUserId = Number(userId);

                if (isNaN(numericUserId)) {
                    throw new Error(`User ID "${userId}" is not a valid number`);
                }

                if (uniqueUserIds.has(numericUserId)) {
                    throw new Error(`Duplicate user ID ${numericUserId} found. Each user can only be assigned once`);
                }
                uniqueUserIds.add(numericUserId);

                const user = await User.findByPk(numericUserId);
                if (!user) {
                    throw new Error(`User with ID ${numericUserId} does not exist`);
                }

                if (user.id_rol !== ROLES.OWNER) {
                    throw new Error(`User with ID ${numericUserId} has role ${user.id_rol}. Only users with OWNER role (${ROLES.OWNER}) can be assigned to a farm`);
                }
            }
            return true;
        }),
];

const validateFarmIndex = [
    query('sortField')
        .optional()
        .default('createdAt')
        .isIn(['id', 'name', 'address', 'createdAt', 'updatedAt'])
        .withMessage('Sort field must be one of: id, name, address, createdAt, updatedAt'),
    
    query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .default('DESC')
        .withMessage('Sort order must be ASC or DESC')
        .customSanitizer(value => value ? value.toUpperCase() : 'DESC'),
    
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
        .toInt()
];

module.exports = {
    validateFarmCreation,
    validateFarmUpdate,
    validateFarmIndex,
};

