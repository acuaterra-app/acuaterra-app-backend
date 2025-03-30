const BaseNotification = require('./base-notification');

class SensorAlertNotification extends BaseNotification {

    constructor(user, title, message, data = {}) {
        super(user, title, message, data);
    }

    getType() {
        return 'sensor_alert';
    }

    static createFromPayload(payload) {
        const { user, title, message, data = {} } = payload;
        return new SensorAlertNotification(user, title, message, data);
    }
}

module.exports = SensorAlertNotification;

