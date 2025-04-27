const express = require('express');
const router = express.Router();
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const { validate } = require('../../middleware/validate.middleware');
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const ValidateUserAccessMiddleware = require("../../middleware/validateUserAccess.middleware");
const { ROLES : Role } = require("../../enums/roles.enum");
const MeasurementController = require('../../controllers/module/measurement.controller');
const MeasurementService = require('../../services/module/measurement.service');
const { createMeasurementValidation} = require('../../validators/module/measurement.validator');
const ValidateSensorThresholdMiddleware = require("../../middleware/validateSensorThreshold.middleware");

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const measurementService = new MeasurementService();
const measurementController = new MeasurementController(measurementService);
const validateRoleMiddleware = new ValidateRoleMiddleware();
const validateUserAccessMiddleware = new ValidateUserAccessMiddleware();
const validateSensor = new ValidateSensorThresholdMiddleware();

router.post(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.MODULE]),
    validate(createMeasurementValidation),
    (req, res, next) => validateSensor.validate(req, res, next),
    (req, res) => measurementController.createMeasurement(req, res)
);

router.get(
    '/',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.OWNER, Role.MONITOR]),
    validateUserAccessMiddleware.extendRoleValidation(),
    validateUserAccessMiddleware.checkMonitorAccess('measurements'),
    validateUserAccessMiddleware.handleRoleBasedAccess(),
    (req, res) => measurementController.getMeasurementsByModule(req, res)
);

module.exports = router;