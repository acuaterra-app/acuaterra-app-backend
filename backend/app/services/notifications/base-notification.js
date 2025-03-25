/**
 * @fileoverview Abstract base class for all notification types
 * This class provides a foundation for building notification payloads
 * to be sent through Firebase Cloud Messaging (FCM).
 * 
 * @requires ../../models/user
 */

/**
 * BaseNotification - Abstract class for all notification types
 * This class cannot be instantiated directly and must be extended.
 * Each subclass should define its own notification type.
 */
class BaseNotification {
  /**
   * Create a new notification
   * @param {import('../../models/user')} user - The User model instance to be notified
   * @param {string} title - The notification title
   * @param {string} message - The notification message/body
   * @param {Object} [data={}] - Additional data to include with the notification
   */
  constructor(user, title, message, data = {}) {
    if (this.constructor === BaseNotification) {
      throw new Error('Cannot instantiate abstract BaseNotification class');
    }

    this.user = user;
    this.title = title;
    this.message = message;
    this.data = data;
  }

  getUser() {
    return this.user;
  }

  getTitle() {
    return this.title;
  }

  getBody() {
    return this.message;
  }

  getData() {
    return this.data;
  }

  getType() {
    throw new Error('getType() method must be implemented by subclass');
  }

  serialize() {
    return {
      to: this.getUser().device_id,
      notification: {
        title: this.getTitle(),
        body: this.getBody()
      },
      data: this.getData()
    };
  }

  validate() {
    if (!this.user) {
      throw new Error('Notification user is required');
    }
    
    if (!this.title) {
      throw new Error('Notification title is required');
    }
    
    if (!this.message) {
      throw new Error('Notification body is required');
    }
    
    if (!this.getType()) {
      throw new Error('Notification type is required');
    }
    
    return true;
  }
}

module.exports = BaseNotification;

