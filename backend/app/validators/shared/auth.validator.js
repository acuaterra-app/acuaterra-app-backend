const {body} = require("express-validator");
const {User} = require("../../../models");

const validateUserLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
        
    body('device_id')
        .optional()
        .isString().withMessage('Device ID must be a string'),
];

const validateChangePassword = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .custom(async (email) => {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User does not exist');
            }

            if (!user.isActive) {
                throw new Error('User is inactive');
            }
            return true;
        }),

    body('oldPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isString().withMessage('newPassword must be a string')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
        .matches(/[0-9]/).withMessage('New password must contain at least one number')
        .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
        .custom((value, { req }) => {
            if (value === req.body.oldPassword) {
                throw new Error('New password cannot be the same as the current password');
            }
            return true;
        }),
];

module.exports = { validateUserLogin, validateChangePassword };