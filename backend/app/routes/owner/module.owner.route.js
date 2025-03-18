const express = require("express");
const router = express.Router();
const ModuleOwnerService = require("../../services/owner/module.owner.services");
const ModuleOwnerController = require("../../controllers/owner/module.owner.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require("../../middleware/validate.middleware");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { validateCreateModule } = require("../../validators/owner/model.validator");
const { ROLES : Role } = require("../../enums/roles.enum");
const ValidateModuleCreateMiddleware = require("../../middleware/validateModuleCreate.middleware");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const moduleOwnerService = new ModuleOwnerService();
const moduleController = new ModuleOwnerController(moduleOwnerService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateModuleCreate = new ValidateModuleCreateMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER]),
    validate(validateCreateModule),
    validateModuleCreate.validateModuleCreation,
    (req, res) => moduleController.create(req, res)
);

module.exports = router;