const express = require('express');
const router = express.Router();

const {validatePagination} =require('../../validators/shared/user.validator');
const {validateMonitorRegistration} =require('../../validators/owner/monitor.owner.validator');
const {validateMonitorUpdate} =require('../../validators/owner/monitor.owner.validator');
const {validate} = require("../../middleware/validate.middleware");
const UserOwnerController = require('../../controllers/owner/user.owner.controller');
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const UserOwnerService = require("../../services/owner/user.owner.service");
const ValidateModuleAccessMiddleware = require("../../middleware/validateModuleAccess.middleware");
const ValidateUsrMonitorUpdateMiddleware = require("../../middleware/validateUserMonitorUpdate.middleware");

const { ROLES: Role } = require("../../enums/roles.enum");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserMonitorCreationMiddleware = require("../../middleware/validateUserMonitorCreation.middleware");
const ValidateMonitorDisableMiddleware = require("../../middleware/validateMonitorDisable.middleware");
const ValidateMonitorReactivateMiddleware = require("../../middleware/validateMonitorReactivate.middleware");
const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const userOwnerService = new UserOwnerService();
const validateRoleMiddleware = new ValidateRoleMiddleware();
const userOwnerController = new UserOwnerController(userOwnerService);
const validateAccess = new ValidateModuleAccessMiddleware();
const validateUserMonitorCreation = new ValidateUserMonitorCreationMiddleware();
const validateUserUpdate = new ValidateUsrMonitorUpdateMiddleware();
const validateMonitorDisable = new ValidateMonitorDisableMiddleware();
const validateMonitorReactivate = new ValidateMonitorReactivateMiddleware();
router.get('/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validatePagination),
    (req, res, next) => validateAccess.validateOwnerModuleAccess(req, res, next),
    (req, res) => userOwnerController.index(req, res)
);

router.post('/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateMonitorRegistration),
    (req, res, next) => validateUserMonitorCreation.validate(req, res, next),
    (req, res) => userOwnerController.createMonitor(req, res)
);

router.put('/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateMonitorUpdate),
    (req, res, next) => validateUserUpdate.validate(req, res, next),
    (req, res) => userOwnerController.updateMonitor(req, res)
);

router.delete('/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    (req, res, next) => validateMonitorDisable.validate(req, res, next),
    (req, res) => userOwnerController.disableMonitor(req, res)
);

router.patch('/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    (req, res, next) => validateMonitorReactivate.validate(req, res, next),
    (req, res) => userOwnerController.reactivateMonitor(req, res)
);

module.exports = router;