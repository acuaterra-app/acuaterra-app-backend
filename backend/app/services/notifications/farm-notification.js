/**
 * @fileoverview Farm notification implementation
 * This class provides a notification type for farm-related events
 * 
 * @requires ./base-notification
 */

const BaseNotification = require('./base-notification');

/**
 * FarmNotification - Notification type for farm-related events
 * @extends BaseNotification
 */
class FarmNotification extends BaseNotification {
  /**
   * Create a new farm notification
   * @param {import('../../models/user')} user - The User model instance to be notified
   * @param {string} title - The notification title
   * @param {string} message - The notification message/body
   * @param {Object} [data={}] - Any data to include with the notification
   */
  constructor(user, title, message, data = {}) {
    // Call parent constructor with recipient from user.device_id
    super(user.device_id, user, title, message, data);
  }

  /**
   * Get the notification type identifier
   * @override
   * @returns {string} The notification type identifier
   */
  getType() {
    return 'farm';
  }

  /**
   * Factory method to create a FarmNotification from a payload object
   * @param {Object} payload - The notification payload
   * @param {import('../../models/user')} payload.user - The User model instance
   * @param {string} payload.title - The notification title
   * @param {string} payload.message - The notification message
   * @param {Object} payload.data - Any data for the notification
   * @returns {FarmNotification} A new FarmNotification instance
   */
  static createFromPayload(payload) {
    const { user, title, message, data = {} } = payload;
    
    return new FarmNotification(
      user,
      title,
      message,
      data
    );
  }
}

module.exports = FarmNotification;

