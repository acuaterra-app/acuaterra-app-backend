const express = require("express");
const router = express.Router();
const DashboardAdminService = require("../../services/admin/dashboard.admin.service");
const DashboardAdminController = require("../../controllers/admin/dashboard.admin.controller");
const ValidateTokenMiddleware = require("../../middleware/validateToken.middleware");
const BlackListService = require("../../services/shared/blacklist.service");
const ValidateRoleMiddleware = require("../../middleware/validateRole.middleware");
const { ROLES: Role } = require("../../enums/roles.enum");
const { validate } = require('../../middleware/validate.middleware');
const { validateNotificationStats } = require('../../validators/admin/dashboard.admin.validator');

const validateTokenMiddleware = new ValidateTokenMiddleware(new BlackListService());
const dashboardAdminService = new DashboardAdminService();
const dashboardController = new DashboardAdminController(dashboardAdminService);
const validateRoleMiddleware = new ValidateRoleMiddleware();

router.get(
    '/metrics',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => dashboardController.getGeneralMetrics(req, res)
);

router.get(
    '/stats',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    (req, res) => dashboardController.getFarmAndModuleStats(req, res)
);

router.get(
    '/notifications',
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([Role.ADMIN]),
    validate(validateNotificationStats),
    (req, res) => dashboardController.getNotificationStats(req, res)
);

module.exports = router;

