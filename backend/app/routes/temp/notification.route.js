const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/temp/notification.controller');

// POST route to send a notification to a specific device
router.post('/send', notificationController.sendDirectNotification);

module.exports = router;
