const express = require("express");
const router = express.Router();
const ModuleAdminService = require("../../services/admin/module.admin.services");
const ModuleAdminController = require("../../controllers/admin/module.admin.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { ROLES : Role } = require("../../enums/roles.enum");
const { validate } = require('../../middleware/validate.middleware');
const { 
    validateGetModulesByFarm, 
    validateGetMeasurementsByModule 
} = require('../../validators/admin/module.admin.validator');

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const moduleAdminService = new ModuleAdminService();
const moduleController = new ModuleAdminController(moduleAdminService);
const validateRoleMiddleware = new ValidateRoleMiddleware();

router.get(
    '/farm/:farmId',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateGetModulesByFarm),
    (req, res) => moduleController.getModulesByFarm(req, res)
);

router.get(
    '/:moduleId/measurements',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateGetMeasurementsByModule),
    (req, res) => moduleController.getMeasurementsByModule(req, res)
);

module.exports = router;
