const { body } = require('express-validator');
const { User, Module } = require('../../../models');
const { Op } = require('sequelize');

const validateMonitorRegistration = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .trim()
        .normalizeEmail()
        .custom(async (value) => {
            const user = await User.findOne({ where: { email: value } });
            if (user) {
                throw new Error('Email already exists');
            }
            return true;
        }),

    body('dni')
        .notEmpty().withMessage('DNI is required')
        .isInt().withMessage('DNI must be a Int')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('DNI must be between 5 and 100 characters')
        .custom(async (value) => {
            const user = await User.findOne({ where: { dni: value } });
            if (user) {
                throw new Error('DNI already exists');
            }
            return true;
        }),

    body('address')
        .notEmpty().withMessage('Address is required')
        .isString().withMessage('Address must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Address must be a maximum of 100 characters')
        .matches(/\d+/).withMessage('Address must contain at least one number')
        .matches(/[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+/).withMessage('Address must contain at least one word'),

    body('contact')
        .notEmpty().withMessage('Contact is required')
        .isInt().withMessage('Contact must be a Int')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('Contact must be between 5 and 100 characters')

];

const validateMonitorUpdate = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .trim()
        .normalizeEmail()
        .custom(async (value, { req }) => {
            const userId = req.params.id;
            const user = await User.findOne({
                where: {
                    email: value,
                    id: { [Op.ne]: userId }
                }
            });
            if (user) {
                throw new Error('Email already exists');
            }
            return true;
        }),

    body('dni')
        .notEmpty().withMessage('DNI is required')
        .isInt().withMessage('DNI must be a Int')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('DNI must be between 5 and 100 characters')
        .custom(async (value, { req }) => {
            const userId = req.params.id;
            const user = await User.findOne({
                where: {
                    dni: value,
                    id: { [Op.ne]: userId }
                }
            });
            if (user) {
                throw new Error('DNI already exists');
            }
            return true;
        }),

    body('address')
        .notEmpty().withMessage('Address is required')
        .isString().withMessage('Address must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Address must be a maximum of 100 characters')
        .matches(/\d+/).withMessage('Address must contain at least one number')
        .matches(/[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+/).withMessage('Address must contain at least one word'),

    body('contact')
        .notEmpty().withMessage('Contact is required')
        .isInt().withMessage('Contact must be a Int')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('Contact must be between 5 and 100 characters')
];

module.exports = { validateMonitorRegistration, validateMonitorUpdate };