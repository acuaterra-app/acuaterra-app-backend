const express = require('express');
const router = express.Router();
const powerAlertController = require('../../controllers/temp/power-alert.controller');

router.post('/simulate', powerAlertController.simulatePowerOutage);

router.post('/send-direct', powerAlertController.sendDirectPowerAlert);

router.get('/event-types', powerAlertController.getAvailableEventTypes);

router.get('/diagnose/:moduleId', powerAlertController.diagnoseModuleUsers);

module.exports = router;

