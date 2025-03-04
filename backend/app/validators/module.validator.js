const { param, query } = require('express-validator');
const { Module } = require('../../models');

const validateListModules = [
        param('farm_id')
            .exists()
            .withMessage('Module ID is required')
            .isNumeric()
            .withMessage('Module ID must be a numeric value')
            .custom(async (farm_id) => {
                const module = await Module.findByPk(farm_id);
                if (!module) {
                    throw new Error(`Module with ID ${id} does not exist in the database`);
                }
                return true;
            }),
    ];

const validateModuleIndex = [
    query('sortField')
        .optional()
        .default('createdAt')
        .isIn(['id', 'name', 'description', 'createdAt', 'updatedAt'])
        .withMessage('Sort field must be one of: id, name, description, createdAt, updatedAt'),
    
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

module.exports = { validateListModules, validateModuleIndex };

