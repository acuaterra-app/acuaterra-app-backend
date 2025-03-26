const express = require('express');
const router = express.Router();
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require('../../middleware/validate.middleware');
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { ROLES : Role } = require("../../enums/roles.enum");
const MeasurementController = require('../../controllers/module/measurement.controller');
const MeasurementService = require('../../services/module/measurement.service');
const { createMeasurementValidation} = require('../../validators/module/measurement.validator');

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const measurementService = new MeasurementService();
const measurementController = new MeasurementController(measurementService);
const validateRoleMiddleware = new ValidateRoleMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.MODULE]),
    validate(createMeasurementValidation),
    (req, res) => measurementController.createMeasurement(req, res)
);

router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.MODULE]),
    (req, res) => measurementController.getMeasurements(req, res)
);

module.exports = router;