const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/temp/fcm.controller');

router.post('/send', notificationController.sendDirectNotification);

module.exports = router;
