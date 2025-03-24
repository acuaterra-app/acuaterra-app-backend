/**
 * Temporary Notification Routes
 * 
 * Routes for testing notifications through Postman or other API clients.
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/temp/notification.controller');

// POST route to send a direct notification to a specific device
router.post('/send-direct', notificationController.sendDirectNotification);

// POST route to send a multicast notification to multiple devices
router.post('/send-multicast', notificationController.sendMulticastNotification);

// POST route to send a notification to a topic
router.post('/send-topic', notificationController.sendTopicNotification);

module.exports = router;

