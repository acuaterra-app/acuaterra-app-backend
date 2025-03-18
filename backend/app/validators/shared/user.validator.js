const { body, query } = require('express-validator');
const { User } = require('../../../models');
const {ROLES, getAdminAllowedRoles, getOwnerAllowedRoles} = require("../../enums/roles.enum");

const validateUserRegistration = [
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

  body('id_rol')
      .notEmpty().withMessage('Role ID is required')
      .isInt({ min: 1 }).withMessage('Role ID must be a positive integer'),

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

const validatePagination = [
query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt()
    .default(1),

query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer')
    .toInt()
    .default(10),

query('sortField')
    .optional()
    .isIn(['id', 'name', 'email', 'dni', 'createdAt', 'updatedAt'])
    .withMessage('Sort field must be one of: id, name, email, dni, createdAt, updatedAt')
    .default('createdAt'),

query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
    .default('DESC'),

query('roles')
    .optional()
    .isString()
    .withMessage('Roles must be a comma-separated string')
    .custom(async (rolesString, {req}) => {
        if (!rolesString) return true;

        const roles = rolesString.split(',').map(role => role.trim());

        if (roles.some(role => isNaN(role) || role === '')) {
            throw new Error('All roles must be valid numbers');
        }

        const uniqueRoles = new Set(roles);

        if (uniqueRoles.size !== roles.length) {
            throw new Error('Duplicate roles are not allowed');
        }

        const authenticatedUser = req.user;
        const validRoleValues = authenticatedUser.id_rol === ROLES.ADMIN ? getAdminAllowedRoles() : getOwnerAllowedRoles();

        const invalidRoles = roles
            .map(role => Number(role))
            .filter(role => !validRoleValues.includes(role));

        if (invalidRoles.length > 0) {
            throw new Error(`Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoleValues.join(', ')}`);
        }
        return true;
    }),
];

module.exports = {
validateUserRegistration,
validatePagination,
};