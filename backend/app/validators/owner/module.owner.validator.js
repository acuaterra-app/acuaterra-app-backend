const { body } = require('express-validator');
const { Farm, Module } = require('../../../models');
const { Op } = require('sequelize');

const validateCreateModule = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

    body('location')
        .notEmpty().withMessage('Location is required')
        .isString().withMessage('Location must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Location must be maximum 100 characters')
        .matches(/\d+/).withMessage('Location must contain at least one number')
        .matches(/[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+/).withMessage('Location must contain at least one word'),

    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isString().withMessage('Latitude must be text')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a number between -180 and 180')
        .matches(/^-?\d+(\.\d+)?$/)
        .withMessage('Invalid latitude format'),

    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isString().withMessage('Longitude must be text')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a number between -180 and 180')
        .matches(/^-?\d+(\.\d+)?$/)
        .withMessage('Invalid longitude format'),

    body('species_fish')
        .notEmpty().withMessage('Fish species is required')
        .isString().withMessage('Species must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Species cannot exceed 100 characters'),

    body('fish_quantity')
        .notEmpty().withMessage('Fish quantity is required')
        .isString().withMessage('Quantity must be text')
        .trim()
        .isInt({ min: 1 }).withMessage('Fish quantity must be a positive integer'),

    body('fish_age')
        .notEmpty().withMessage('Fish age is required')
        .isInt({ min: 0 }).withMessage('Fish age must be a positive integer')
        .trim(),

    body('dimensions')
        .notEmpty().withMessage('Dimensions are required')
        .isString().withMessage('Dimensions must be text')
        .trim()
        .matches(/^\d+x\d+x\d+$/).withMessage('Invalid dimensions format (example: 10x5x3)'),

    body('id_farm')
        .notEmpty().withMessage('Farm ID is required')
        .isNumeric().withMessage('Farm ID must be a number')
        .custom(async (id) => {
            const farm = await Farm.findByPk(id);
            if (!farm) {
                throw new Error('The specified farm does not exist');
            }
            return true;
        })
];

const validateUpdateModule = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
        .custom(async (name, { req }) => {
            const existingModule = await Module.findOne({
                where: {
                    name: name,
                    id_farm: req.body.id_farm,
                    id: { [Op.ne]: req.params.id } 
                }
            });
            if (existingModule) {
                throw new Error('A module with this name already exists in this farm');
            }
            return true;
        }),

    body('location')
        .notEmpty().withMessage('Location is required')
        .isString().withMessage('Location must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Location must be maximum 100 characters')
        .matches(/\d+/).withMessage('Location must contain at least one number')
        .matches(/[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+/).withMessage('Location must contain at least one word'),

    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isString().withMessage('Latitude must be text')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a number between -180 and 180')
        .matches(/^-?\d+(\.\d+)?$/)
        .withMessage('Invalid latitude format'),

    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isString().withMessage('Longitude must be text')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a number between -180 and 180')
        .matches(/^-?\d+(\.\d+)?$/)
        .withMessage('Invalid longitude format'),

    body('species_fish')
        .notEmpty().withMessage('Fish species is required')
        .isString().withMessage('Species must be text')
        .trim()
        .isLength({ max: 100 }).withMessage('Species cannot exceed 100 characters'),

    body('fish_quantity')
        .notEmpty().withMessage('Fish quantity is required')
        .isString().withMessage('Quantity must be text')
        .trim()
        .isInt({ min: 1 }).withMessage('Fish quantity must be a positive integer'),

    body('fish_age')
        .notEmpty().withMessage('Fish age is required')
        .isInt({ min: 0 }).withMessage('Fish age must be a positive integer')
        .trim(),

    body('dimensions')
        .notEmpty().withMessage('Dimensions are required')
        .isString().withMessage('Dimensions must be text')
        .trim()
        .matches(/^\d+x\d+x\d+$/).withMessage('Invalid dimensions format (example: 10x5x3)'),

    body('id_farm')
        .notEmpty().withMessage('Farm ID is required')
        .isNumeric().withMessage('Farm ID must be a number')
        .custom(async (id) => {
            const farm = await Farm.findByPk(id);
            if (!farm) {
                throw new Error('The specified farm does not exist');
            }
            return true;
        })
];

module.exports = { validateCreateModule, validateUpdateModule };
