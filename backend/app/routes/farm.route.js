const express = require("express");
const router = express.Router();
const FarmService = require("../services/farm.services");
const FarmController = require("../controllers/farm.controller");
const ValidateTokenMiddleware = require("../middleware/validateToken.middleware");
const BlackListService = require("../services/blacklist.service");
const { validate } = require("../middleware/validate.middleware");
const { validateFarmCreation, validateFarmUpdate, validateFarmIndex} = require("../validators/farm.validator");
const ValidateRoleMiddleware = require("../middleware/validateRole.middleware");
const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const farmService = new FarmService();
const farmController = new FarmController(farmService);
const Role = require("../enums/roles.enum");

const validateRoleMiddleware = new ValidateRoleMiddleware();

// Create a Farm
router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateFarmCreation),
    (req, res) => farmController.create(req, res)
);

// List all Farms
router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateFarmIndex),
    (req, res) => farmController.index(req, res)
);

// Get a Farm
router.get(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.show(req, res)
);

// Update a Farm
router.put(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateFarmUpdate),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.update(req, res)
);

// Delete a Farm
router.delete(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.destroy(req, res)
);

module.exports = router;