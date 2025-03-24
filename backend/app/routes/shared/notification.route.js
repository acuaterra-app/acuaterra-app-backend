const express = require('express');
const router = express.Router();
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const ValidateRoleMiddleware = require('../../middleware/validateRole.middleware');
const validateRoleMiddleware = new ValidateRoleMiddleware();
const NotificationController = require('../../controllers/shared/notification.controller');
const { ROLES } = require('../../enums/roles.enum');

const blackListService = new BlackListService();
const validateTokenMiddleware = new ValidateTokenMiddleware(blackListService);

// Get paginated notifications for authenticated user (owner or monitor)
router.get(
  '/',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR])
  ],
  NotificationController.index
);

module.exports = router;

