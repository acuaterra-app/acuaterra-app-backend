const express = require('express');
const router = express.Router();

const {validateUserRegistration, validatePagination} = require('../../validators/shared/user.validator');
const {validateUserUpdate} = require('../../validators/shared/user.update.validator');
const {validate} = require("../../middleware/validate.middleware");
const UserController = require('../../controllers/shared/user.controller');
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const UserService = require("../../services/shared/user.service");
const Mailer = require('../../utils/Mailer');
const { ROLES: Role } = require("../../enums/roles.enum");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserCreationMiddleware = require("../../middleware/validateUserCreation.middleware");
const ValidateUserUpdateMiddleware = require("../../middleware/validateUserUpdate.middleware");

const validateUserUpdateMiddleware = new ValidateUserUpdateMiddleware();
const mailer = new Mailer(process.env.RESEND_API_KEY);
const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const userService = new UserService(mailer);
const userController = new UserController(userService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserCreation = new ValidateUserCreationMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateUserRegistration),
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER]),
    (req, res, next) => validateUserCreation.validateUserCreation(req, res , next),
    (req, res) => userController.register(req, res)
    );

router.put(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateUserUpdate),
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER]),
    (req, res, next) => validateUserUpdateMiddleware.validateUserUpdate(req, res, next),
    (req, res) => userController.update(req, res)
);

module.exports = router;