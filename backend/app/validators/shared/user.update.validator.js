const { body } = require('express-validator');
const { User } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');

const validateUserUpdate = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('email')
        .custom(async (value, { req }) => {

            const currentUser = await User.findByPk(req.params.id);
            if (!currentUser) {
                throw new Error('User not found');
            }

            if (value.toString().toLowerCase() === currentUser.email.toString().toLowerCase()) {
                return true;
            }

            const existingUser = await User.findOne({
                where: { email: value.toLowerCase() }
            });

            if (existingUser && existingUser.id.toString() !== req.params.id.toString()) {
                throw new Error('Email already exists');
            }

            return true;
        })
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .trim()
        .normalizeEmail(),

    body('dni')
        .custom(async (value, { req }) => {

            const currentUser = await User.findByPk(req.params.id);
            if (!currentUser) {
                throw new Error('User not found');
            }

            if (value.toString() === currentUser.dni.toString()) {
                return true;
            }

            const existingUser = await User.findOne({
                where: { dni: value }
            });

            if (existingUser && existingUser.id.toString() !== req.params.id.toString()) {
                throw new Error('DNI already exists');
            }

            return true;
        })
        .notEmpty().withMessage('DNI is required')
        .isInt().withMessage('DNI must be a Int')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('DNI must be between 5 and 100 characters'),

    body('id_rol')
        .notEmpty().withMessage('Role ID is required')
        .isIn(Object.values(ROLES)).withMessage('Role must be a role from the list'),

    body('address')
        .optional()
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

module.exports = {
    validateUserUpdate
};
