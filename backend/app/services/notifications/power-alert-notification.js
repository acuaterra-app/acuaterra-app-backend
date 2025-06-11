/**
 * @fileoverview Power Alert notification implementation
 * This class provides a notification type for power/energy-related events
 * 
 * @requires ./base-notification
 */

const BaseNotification = require('./base-notification');

/**
 * PowerAlertNotification - Notification type for power/energy-related events
 * @extends BaseNotification
 */
class PowerAlertNotification extends BaseNotification {
  /**
   * Create a new power alert notification
   * @param {import('../../models/user')} user - The User model instance to be notified
   * @param {string} title - The notification title
   * @param {string} message - The notification message/body
   * @param {Object} [data={}] - Any data to include with the notification
   */
  constructor(user, title, message, data = {}) {
    super(user, title, message, data);
  }

  /**
   * Get the notification type identifier
   * @override
   * @returns {string} The notification type identifier
   */
  getType() {
    return 'power_alert';
  }

  static createFromPayload(payload) {
    const { user, title, message, data = {} } = payload;

    return new PowerAlertNotification(
      user,
      title,
      message,
      data
    );
  }
}

module.exports = PowerAlertNotification;

