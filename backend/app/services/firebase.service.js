const admin = require('firebase-admin');
const logger = require('../utils/logger'); // Assuming there's a logger utility

/**
 * Firebase service class to manage Firebase Admin SDK initialization
 * and provide methods for FCM notifications
 */
class FirebaseService {
  constructor() {
    this.initialized = false;
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      // Check if Firebase is already initialized
      if (this.initialized || admin.apps.length > 0) {
        logger.info('Firebase Admin SDK already initialized');
        this.initialized = true;
        return;
      }

      // Initialize Firebase Admin SDK
      // You should replace this with your actual service account credentials
      // and database URL or store these in environment variables
      const serviceAccount = process.env.FCM_API_KEY
        ? JSON.parse(process.env.FCM_API_KEY)
        : require('../../../config/firebase-service-account.json');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      this.initialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.initialized = false;
      logger.error('Failed to initialize Firebase Admin SDK', error);
      throw new Error(`Firebase initialization error: ${error.message}`);
    }
  }

  /**
   * Send FCM notification using a notification object from the parent notification class
   * @param {BaseNotification} notification - An instance of the BaseNotification class or its subclasses
   * @returns {Promise<Object>} The FCM response
   */
  async sendNotification(notification) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!notification || typeof notification.serialize !== 'function') {
        throw new Error('Invalid notification object. Must be an instance of BaseNotification with a serialize method.');
      }

      // Get the FCM formatted payload from the notification object
      const fcmPayload = notification.serialize();
      
      // Validate the payload
      if (!fcmPayload.to) {
        throw new Error('Recipient (to) is required for FCM notification');
      }

      // Extract the needed properties for FCM
      const { to, notification: notificationContent, data } = fcmPayload;

      // Determine if we're sending to a topic or a device
      const isToken = to.includes(':') || to.length > 64;
      const message = {
        notification: notificationContent,
        data: this.sanitizeData(data),
      };

      let response;
      if (isToken) {
        // Send to specific device
        message.token = to;
        response = await admin.messaging().send(message);
      } else if (to.startsWith('/topics/')) {
        // Send to a topic
        message.topic = to.replace('/topics/', '');
        response = await admin.messaging().send(message);
      } else {
        // Assume it's a regular token
        message.token = to;
        response = await admin.messaging().send(message);
      }

      logger.info('FCM notification sent successfully', { messageId: response });
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Failed to send FCM notification', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'unknown_error',
      };
    }
  }

  /**
   * Send multiple FCM notifications (up to 500 at once)
   * @param {Array<BaseNotification>} notifications - Array of notification objects
   * @returns {Promise<Object>} The FCM response
   */
  async sendMulticastNotification(notifications) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!Array.isArray(notifications) || notifications.length === 0) {
        throw new Error('Notifications must be a non-empty array');
      }

      if (notifications.length > 500) {
        throw new Error('You can only send up to 500 messages in a single batch');
      }

      // Serialize each notification and prepare FCM messages
      const messages = notifications.map(notification => {
        if (typeof notification.serialize !== 'function') {
          throw new Error('All notifications must be instances of BaseNotification with a serialize method.');
        }
        
        const fcmPayload = notification.serialize();
        return {
          token: fcmPayload.to,
          notification: fcmPayload.notification,
          data: this.sanitizeData(fcmPayload.data),
        };
      });

      const tokens = messages.map(m => m.token);
      const response = await admin.messaging().sendMulticast({ tokens });

      logger.info('FCM multicast sent successfully', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      logger.error('Failed to send FCM multicast notification', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'unknown_error',
      };
    }
  }

  /**
   * Ensures all data values are strings as required by FCM
   * @param {Object} data - The data object to sanitize
   * @returns {Object} Sanitized data object with string values
   */
  sanitizeData(data) {
    if (!data) return {};

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert all values to strings as required by FCM
      sanitized[key] = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    }
    return sanitized;
  }
}

// Singleton instance
let instance = null;

/**
 * Get the FirebaseService instance (Singleton pattern)
 * @returns {FirebaseService} The singleton instance
 */
function getFirebaseServiceInstance() {
  if (!instance) {
    instance = new FirebaseService();
  }
  return instance;
}

module.exports = getFirebaseServiceInstance();

