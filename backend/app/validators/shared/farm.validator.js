const {query} = require("express-validator");

const validateFarmPaginate = [
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

module.exports = { validateFarmPaginate };