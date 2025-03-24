const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/temp/fcm.controller');

// POST route to send a notification to a specific device
router.post('/send', notificationController.sendDirectNotification);

module.exports = router;
