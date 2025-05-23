const express = require("express");
const router = express.Router();
const FarmOwnerService = require("../../services/owner/farm.owner.services");
const FarmOwnerController = require("../../controllers/owner/farm.owner.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require("../../middleware/validate.middleware");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserAccessMiddleware = require("../../middleware/user/validateUserAccess.middleware");
const { validateFarmPaginate } = require("../../validators/shared/farm.validator");
const { ROLES : Role } = require("../../enums/roles.enum");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const farmOwnerService = new FarmOwnerService();
const farmController = new FarmOwnerController(farmOwnerService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserAccessMiddleware = new ValidateUserAccessMiddleware();

router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER, Role.MONITOR]),
    validateUserAccessMiddleware.extendRoleValidation(),
    validateUserAccessMiddleware.handleRoleBasedAccess(),
    validate(validateFarmPaginate),
    (req, res) => farmController.index(req, res)
);

module.exports = router;

