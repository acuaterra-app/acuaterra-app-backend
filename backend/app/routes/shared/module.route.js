const express = require("express");
const router = express.Router();
const ModuleService = require("../../services/shared/module.shared.services");
const ModuleController = require("../../controllers/shared/module.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserAccessMiddleware = require("../../middleware/validateUserAccess.middleware");
const { ROLES: Role } = require("../../enums/roles.enum");
const {validate} = require("../../middleware/validate.middleware");
const {validateModulePaginate, validateIndexModules} = require("../../validators/shared/module.validator");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserAccessMiddleware = new ValidateUserAccessMiddleware();

const moduleService = new ModuleService();
const moduleController = new ModuleController(moduleService);

// Get All Modules by Farm
router.get(
    '/:farm_id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateIndexModules),
    // Permitir acceso a monitores
    validateRoleMiddleware.validate([Role.ADMIN, Role.OWNER, Role.MONITOR]),
    // Agregar middleware de validación de acceso
    validateUserAccessMiddleware.extendRoleValidation(),
    // Verificar acceso del monitor a la granja
    validateUserAccessMiddleware.checkMonitorAccess('farm'),
    validate(validateModulePaginate),
    // Filtrar módulos según el rol
    validateUserAccessMiddleware.handleRoleBasedAccess(),
    (req, res) => moduleController.index(req, res)
);

module.exports = router;

