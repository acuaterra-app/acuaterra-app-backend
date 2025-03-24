const express = require("express");
const router = express.Router();
const ModuleService = require("../../services/shared/module.shared.services");
const ModuleController = require("../../controllers/shared/module.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { ROLES: Role } = require("../../enums/roles.enum");
const {validate} = require("../../middleware/validate.middleware");
const {validateModulePaginate, validateIndexModules} = require("../../validators/shared/module.validator");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const validateRoleMiddleware = new ValidateRoleMiddleware();

const moduleService = new ModuleService();
const moduleController = new ModuleController(moduleService);

// Get All Modules by Farm
router.get(
    '/:farm_id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateIndexModules),
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER]),
    validate(validateModulePaginate),
    (req, res) => moduleController.index(req, res)
);

module.exports = router;

