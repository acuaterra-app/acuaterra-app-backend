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
   * @param {string} recipient - The device token to receive the notification
   * @param {import('../../models/user')} user - The User model instance to be notified
   * @param {Object} [data={}] - Additional data to include with the notification
   */
  constructor(recipient, user, data = {}) {
    // Prevent direct instantiation of abstract class
    if (this.constructor === BaseNotification) {
      throw new Error('Cannot instantiate abstract BaseNotification class');
    }

    this.recipient = recipient;
    this.user = user;
    this.data = data;
  }

  /**
   * Get the notification title (must be implemented by subclasses)
   * @abstract
   * @returns {string} The notification title
   */
  getTitle() {
    throw new Error('getTitle() method must be implemented by subclass');
  }

  /**
   * Get the notification body (must be implemented by subclasses)
   * @abstract
   * @returns {string} The notification body
   */
  getBody() {
    throw new Error('getBody() method must be implemented by subclass');
  }

  /**
   * Get additional data for the notification (must be implemented by subclasses)
   * @abstract
   * @returns {Object} The notification data payload
   */
  getData() {
    throw new Error('getData() method must be implemented by subclass');
  }

  /**
   * Get the notification type identifier (must be implemented by subclasses)
   * Each subclass should override this method to provide its unique notification type
   * @abstract
   * @returns {string} The notification type identifier
   */
  getType() {
    throw new Error('getType() method must be implemented by subclass');
  }

  /**
   * Serialize the notification into FCM format
   * @returns {Object} FCM formatted payload
   */
  serialize() {
    return {
      to: this.recipient,
      notification: {
        title: this.getTitle(),
        body: this.getBody()
      },
      data: {
        notification_type: this.getType(),
        ...this.getData()
      }
    };
  }

  /**
   * Validate that the notification has all required fields
   * @returns {boolean} True if valid, throws an error otherwise
   * @throws {Error} If the notification is missing required fields
   */
  validate() {
    if (!this.recipient) {
      throw new Error('Notification recipient is required');
    }
    
    if (!this.user) {
      throw new Error('Notification user is required');
    }
    
    if (!this.getTitle()) {
      throw new Error('Notification title is required');
    }
    
    if (!this.getBody()) {
      throw new Error('Notification body is required');
    }
    
    if (!this.getType()) {
      throw new Error('Notification type is required');
    }
    
    return true;
  }
}

module.exports = BaseNotification;

