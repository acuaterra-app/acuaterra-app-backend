const express = require('express');
const router = express.Router();

const {validatePagination} =require('../../validators/shared/user.validator');
const {validateMonitorCreation} =require('../../validators/owner/monitor.validator');
const {validate} = require("../../middleware/validate.middleware");
const UserOwnerController = require('../../controllers/owner/user.owner.controller');
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const UserOwnerService = require("../../services/owner/user.owner.service");
const ValidateModuleAccessMiddleware = require("../../middleware/validateModuleAccess.middleware");

const { ROLES: Role } = require("../../enums/roles.enum");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserMonitorCreationMiddleware = require("../../middleware/validateUserMonitorCreation.middleware");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const userOwnerService = new UserOwnerService();
const validateRoleMiddleware = new ValidateRoleMiddleware();
const userOwnerController = new UserOwnerController(userOwnerService);
const validateAccess = new ValidateModuleAccessMiddleware();
const validateUserMonitorCreation = new ValidateUserMonitorCreationMiddleware();

router.get('/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validatePagination),
    (req, res, next) => validateAccess.validateOwnerFarmAccess(req, res, next),
    (req, res) => userOwnerController.index(req, res)
);

router.post('/monitor/create',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateMonitorCreation),
    (req, res, next) => validateUserMonitorCreation.validate(req, res, next),
    (req, res) => userOwnerController.createMonitor(req, res)
);

module.exports = router;