const { body } = require('express-validator');
const { Module } = require('../../../models');

const validateMonitorCreation = [
    body('name')
        .notEmpty().withMessage('El nombre es requerido')
        .isString().withMessage('El nombre debe ser un string')
        .isLength({ max: 255 }).withMessage('El nombre no puede exceder los 255 caracteres'),

    body('email')
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Por favor, proporcione un email válido')
        .isLength({ max: 100 }).withMessage('El email no puede exceder los 100 caracteres')
        .normalizeEmail(),

    body('dni')
        .notEmpty().withMessage('El DNI es requerido')
        .isString().withMessage('El DNI debe ser un string')
        .isLength({ max: 255 }).withMessage('El DNI no puede exceder los 255 caracteres'),

    body('address')
        .optional()
        .isString().withMessage('La dirección debe ser un string')
        .isLength({ max: 100 }).withMessage('La dirección no puede exceder los 100 caracteres'),

    body('contact')
        .notEmpty().withMessage('El contacto es requerido')
        .isString().withMessage('El contacto debe ser un string'),

    body('id_module')
        .notEmpty().withMessage('El ID del módulo es requerido')
        .isInt({ min: 1 }).withMessage('El ID del módulo debe ser un número entero positivo')
        .toInt()
        .custom(async (moduleId) => {
            const module = await Module.findByPk(moduleId);
            if (!module) {
                throw new Error(`El módulo con ID ${moduleId} no existe`);
            }
            return true;
        }),
];

module.exports = {
    validateMonitorCreation
};

