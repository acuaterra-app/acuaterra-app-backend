const express = require("express");
const router = express.Router();
const FarmOwnerService = require("../../services/owner/farm.owner.services");
const FarmOwnerController = require("../../controllers/owner/farm.owner.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require("../../middleware/validate.middleware");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserAccessMiddleware = require("../../middleware/validateUserAccess.middleware");
const { validateFarmPaginate } = require("../../validators/shared/farm.validator");
const { ROLES : Role } = require("../../enums/roles.enum");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const farmOwnerService = new FarmOwnerService();
const farmController = new FarmOwnerController(farmOwnerService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserAccessMiddleware = new ValidateUserAccessMiddleware();

// Get farms for owner or monitor (filtered for monitors)
router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    // Allow both OWNER and MONITOR roles for GET requests
    validateRoleMiddleware.validate([Role.OWNER, Role.MONITOR]),
    // Extend role validation to set proper flags based on role
    validateUserAccessMiddleware.extendRoleValidation(),
    // Handle role-based access control and filter data for monitors
    validateUserAccessMiddleware.handleRoleBasedAccess(),
    validate(validateFarmPaginate),
    (req, res) => farmController.index(req, res)
);

// All other routes remain OWNER only
// We don't need to modify them as validateRoleMiddleware already restricts access

module.exports = router;

