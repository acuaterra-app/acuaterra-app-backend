const express = require("express");
const router = express.Router();
const ModuleService = require("../services/module.services");
const ModuleController = require("../controllers/module.controller");
const ValidateTokenMiddleware = require("../middleware/validateToken.middleware");
const BlackListService = require("../services/blacklist.service");
const ValidateRoleMiddleware = require("../middleware/validateRole.middleware");
const Role = require("../enums/roles.enum");
const {validate} = require("../middleware/validate.middleware");
const {validateListModules, validateModuleIndex} = require("../validators/module.validator");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const validateRoleMiddleware = new ValidateRoleMiddleware();

const moduleService = new ModuleService();
const moduleController = new ModuleController(moduleService);

// Get All Modules by Farm
router.get(
    '/:farm_id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateModuleIndex),
    validate(validateListModules),
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER]),
    validate(validateListModules),
    (req, res) => moduleController.index(req, res)
);

module.exports = router;

