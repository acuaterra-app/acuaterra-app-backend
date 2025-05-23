const express = require('express');
const router = express.Router();
const ValidateTokenMiddleware = require('../../middleware/validateToken.middleware');
const BlackListService = require('../../services/shared/blacklist.service');
const ValidateRoleMiddleware = require('../../middleware/validateRole.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { validateNotificationQuery, validateNotificationId } = require('../../validators/shared/notification.validator');
const validateRoleMiddleware = new ValidateRoleMiddleware();
const NotificationController = require('../../controllers/shared/notification.controller');
const { ROLES } = require('../../enums/roles.enum');

const blackListService = new BlackListService();
const validateTokenMiddleware = new ValidateTokenMiddleware(blackListService);

router.get(
  '/',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR]),
    validate(validateNotificationQuery)
  ],
  NotificationController.index
);

router.patch(
  '/:id/read',
  [
    validateTokenMiddleware.validate.bind(validateTokenMiddleware),
    validateRoleMiddleware.validate([ROLES.OWNER, ROLES.MONITOR]),
    validate(validateNotificationId)
  ],
  NotificationController.markAsRead
);

module.exports = router;
