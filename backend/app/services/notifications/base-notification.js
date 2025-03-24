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
   * @param {string} title - The notification title
   * @param {string} message - The notification message/body
   * @param {Object} [data={}] - Additional data to include with the notification
   */
  constructor(recipient, user, title, message, data = {}) {
    // Prevent direct instantiation of abstract class
    if (this.constructor === BaseNotification) {
      throw new Error('Cannot instantiate abstract BaseNotification class');
    }

    this.recipient = recipient;
    this.user = user;
    this.title = title;
    this.message = message;
    this.data = data;
  }

  /**
   * Get the notification title
   * @returns {string} The notification title
   */
  getTitle() {
    return this.title;
  }

  /**
   * Get the notification body
   * @returns {string} The notification body
   */
  getBody() {
    return this.message;
  }

  /**
   * Get additional data for the notification
   * @returns {Object} The notification data payload
   */
  getData() {
    return this.data;
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
    // Get the user's data exactly as provided
    const userData = this.getData();
    
    // Log the original data for debugging
    console.log('Original user data for FCM:', JSON.stringify(userData, null, 2));
    
    // Create payload preserving all user data
    const payload = {
      to: this.recipient,
      notification: {
        title: this.getTitle(),
        body: this.getBody()
      },
      data: userData
    };
    
    // Log the payload for debugging
    console.log('FCM Payload before sending:', JSON.stringify(payload, null, 2));
    
    return payload;
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

