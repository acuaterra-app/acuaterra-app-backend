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

//Create a new farm
router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateFarmCreation),
    validate(validateFarmIndex),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.create(req, res)
);

//Get all farms
router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateFarmIndex),
    (req, res) => farmController.index(req, res)
);

//Get a farm by ID
router.get(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.show(req, res)
);

//Update a farm by ID
router.put(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validate(validateFarmUpdate),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.update(req, res)
);

//Delete a farm by ID
router.delete(
    '/:id',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => farmController.destroy(req, res)
);

module.exports = router;