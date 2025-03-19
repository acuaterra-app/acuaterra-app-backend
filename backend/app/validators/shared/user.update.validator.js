const { body } = require('express-validator');
const { User } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');

const validateUserUpdate = [
    body('name')
        .custom(async (value, { req }) => {
            if (!value) return true;
            return true;
        })
        .isString().withMessage('Name must be a string')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('email')

        .custom(async (value, { req }) => {
            if (!value) return true;
            
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
        .isEmail().withMessage('Please provide a valid email address')
        .trim()
        .normalizeEmail(),

    body('dni')
        .custom(async (value, { req }) => {
            if (!value) return true;

            if (!/^\d+$/.test(value)) {
                throw new Error('DNI must contain only numbers');
            }

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
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('DNI must be between 5 and 20 characters'),

    body('id_rol')
        .custom(async (value, { req }) => {
            if (!value) return true;
            return true;
        })
        .isIn(Object.values(ROLES)).withMessage('Role ID must be a positive integer'),

    body('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('Address must be a maximum of 100 characters')
        .matches(/\d+/).withMessage('Address must contain at least one number')
        .matches(/[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+/).withMessage('Address must contain at least one word'),

    body('contact')
        .custom(async (value, { req }) => {
            if (!value) return true;
            return true;
        })
        .isInt().withMessage('Contact must be a string')
        .matches(/^\d+$/).withMessage('Contact must contain only numbers')
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('Contact must be between 5 and 20 characters')
];

module.exports = {
    validateUserUpdate
};
