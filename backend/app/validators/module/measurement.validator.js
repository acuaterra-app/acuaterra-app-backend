const { body, query } = require('express-validator');
const SENSOR_TYPES = require('../../enums/sensor_types.enum');

const getMeasurementsValidation = [
    query('moduleId')
        .notEmpty().withMessage('Module ID is required')
        .isInt().withMessage('Module ID must be an integer'),
    
    query('sensorId')
        .notEmpty().withMessage('Sensor ID is required')
        .isInt().withMessage('Sensor ID must be an integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 }).withMessage('Limit must be an integer between 1 and 1000')
];

const createMeasurementValidation = [

    body('type')
        .notEmpty().withMessage('Sensor type is required')
        .isString().withMessage('Sensor type must be a string')
        .isIn(Object.values(SENSOR_TYPES)).withMessage('Sensor type must be either temperature or humidity'),

    body('value')
        .notEmpty().withMessage('Measurement value is required')
        .isFloat().withMessage('Measurement value must be a number'),

    body('date')
        .notEmpty().withMessage('Date is required')
        .isDate().withMessage('Invalid date format'),

    body('time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time format (HH:mm)')
];

module.exports = { 
    createMeasurementValidation,
    getMeasurementsValidation 
};