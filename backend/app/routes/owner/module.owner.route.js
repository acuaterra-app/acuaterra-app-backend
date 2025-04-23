const express = require("express");
const router = express.Router();
const ModuleOwnerService = require("../../services/owner/module.owner.services");
const ModuleOwnerController = require("../../controllers/owner/module.owner.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require("../../middleware/validate.middleware");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { validateCreateModule, validateUpdateModule } = require("../../validators/owner/module.owner.validator");
const { ROLES : Role } = require("../../enums/roles.enum");
const ValidateModuleCreateMiddleware = require("../../middleware/validateModuleCreate.middleware");
const ValidateModuleUpdateMiddleware = require("../../middleware/validateModuleUpdate.middleware");
const ValidateModuleDeleteMiddleware = require("../../middleware/validateModuleDelete.middleware");
const ValidateModuleShowMiddleware = require("../../middleware/validateModuleShow.middleware");
const ValidateModuleMonitorAssignmentMiddleware = require("../../middleware/validateModuleMonitorAssignment.middleware");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const moduleOwnerService = new ModuleOwnerService();
const moduleController = new ModuleOwnerController(moduleOwnerService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateModuleCreate = new ValidateModuleCreateMiddleware();
const validateModuleUpdate = new ValidateModuleUpdateMiddleware();
const validateModuleDelete = new ValidateModuleDeleteMiddleware();
const validateModuleShow = new ValidateModuleShowMiddleware();
const validateModuleMonitorAssignment = new ValidateModuleMonitorAssignmentMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateCreateModule),
    (req, res, next) => validateModuleCreate.validate(req, res , next),
    (req, res) => moduleController.create(req, res)
);

router.get(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    (req, res, next) => validateModuleShow.validate(req, res, next),
    (req, res) => moduleController.show(req, res)
);

router.put(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateUpdateModule),
    (req, res, next) => validateModuleUpdate.validate(req, res, next),
    (req, res) => moduleController.update(req, res)
);

router.delete(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    (req, res, next) => validateModuleDelete.validate(req, res, next),
    (req, res) => moduleController.delete(req, res)
);

router.post(
    '/:moduleId/monitors',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    (req, res, next) => validateModuleMonitorAssignment.validate(req, res, next),
    (req, res) => moduleController.assignMonitor(req, res)
);

module.exports = router;
