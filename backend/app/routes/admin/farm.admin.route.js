const express = require("express");
const router = express.Router();
const FarmAdminService = require("../../services/admin/farm.admin.services");
const FarmAdminController = require("../../controllers/admin/farm.admin.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require("../../middleware/validate.middleware");
const { validateFarmCreation, validateFarmUpdate} = require("../../validators/admin/farm.admin.validator");
const { validateFarmPaginate } = require("../../validators/shared/farm.validator");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { ROLES: Role } = require("../../enums/roles.enum");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const farmAdminService = new FarmAdminService();
const farmAdminController = new FarmAdminController(farmAdminService);
const validateRoleMiddleware = new ValidateRoleMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateFarmCreation),
    (req, res) => farmAdminController.create(req, res)
);

router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateFarmPaginate),
    (req, res) => farmAdminController.index(req, res)
);

router.get(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmAdminController.show(req, res)
);

router.put(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateFarmUpdate),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmAdminController.update(req, res)
);

router.delete(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmAdminController.destroy(req, res)
);
module.exports = router;
