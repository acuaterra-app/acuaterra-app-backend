const BaseNotification = require('./base-notification');
const FarmNotification = require('./farm-notification');

/**
 * Factory class for creating notification instances based on type
 */
class NotificationFactory {
  /**
   * Creates a notification instance based on the given type and payload
   * @param {string} type - Type of notification to create
   * @param {Object} payload - Data payload for the notification
   * @returns {BaseNotification} - An instance of the specified notification type
   * @throws {Error} If the notification type is unknown
   */
  static createNotification(type, payload) {
    switch (type) {
      case 'farm':
        return FarmNotification.createFromPayload(payload);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

module.exports = NotificationFactory;

