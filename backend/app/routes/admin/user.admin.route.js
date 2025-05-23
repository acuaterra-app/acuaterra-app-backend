const express = require('express');
const router = express.Router();

const {validateUserRegistration, validatePagination} =require('../../validators/shared/user.validator');
const {validate} = require("../../middleware/validate.middleware");
const UserController = require('../../controllers/shared/user.controller');
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const UserService = require("../../services/shared/user.service");
const Mailer = require('../../utils/Mailer');
const { ROLES: Role } = require("../../enums/roles.enum");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserCreationMiddleware = require("../../middleware/validateUserCreation.middleware");
const ValidateUserDeleteMiddleware = require("../../middleware/validateUserDelete.middleware");


const mailer = new Mailer(process.env.RESEND_API_KEY);
const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const userService = new UserService(mailer);
const userController = new UserController(userService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserCreation = new ValidateUserCreationMiddleware();
const validateUserDelete = new ValidateUserDeleteMiddleware();


router.get('/',  
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validatePagination),
    (req, res) => userController.index(req, res)
);

router.get('/:id',  validateTokenMiddleware.validate.bind(validateTokenMiddleware), UserController.find);

router.delete(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER]),
    (req, res, next) => validateUserDelete.validate(req, res, next),
    (req, res) => userController.delete(req, res)
);


module.exports = router;

