const {body} = require("express-validator");

const validateUserLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
        
    body('device_id')
        .notEmpty().withMessage('Device ID is required')
        .isString().withMessage('Device ID must be a string'),
];

module.exports = { validateUserLogin };