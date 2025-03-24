const express = require('express');
const router = express.Router();
const ValidateTokenMiddleware = require('../middleware/validateToken.middleware');
const BlackListService = require('../services/shared/blacklist.service');
const ValidateRoleMiddleware = require('../middleware/validateRole.middleware');
const validateRoleMiddleware = new ValidateRoleMiddleware();
const NotificationController = require('../controllers/shared/notification.controller');
const { ROLES } = require('../enums/roles.enum');

const blackListService = new BlackListService();
const validateTokenMiddleware = new ValidateTokenMiddleware(blackListService);

// Get all notifications for authenticated user (owner or monitor)
router.get(
  '/list',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR])
  ],
  NotificationController.listNotifications
);

// Get paginated notifications for authenticated user (owner or monitor)
router.get(
  '/paginated',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR])
  ],
  NotificationController.listNotificationsPaginated
);

// Mark notification as read
router.put(
  '/mark-read/:id',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR])
  ],
  NotificationController.markNotificationAsRead
);

module.exports = router;

