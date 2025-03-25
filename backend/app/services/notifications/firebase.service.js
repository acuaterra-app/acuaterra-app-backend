const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const logger = require('../../utils/logger');

// Path to Firebase service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../../config/firebase-service-account.json');

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
        this.initialized = true;
        logger.info('Firebase Admin SDK already initialized');
        return;
      }

      // Check if the service account file exists
      if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error('Firebase service account file not found');
      }

      // Load service account file
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);

      // Check for environment variables to override service account values
      const envPrivateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
      const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Override with environment variable values if they exist
      if (envPrivateKeyId) {
        serviceAccount.private_key_id = envPrivateKeyId;
        logger.info('Using private key ID from environment variable');
      } else {
        logger.info('Using private key ID from service account file');
      }
      
      if (envPrivateKey) {
        // Environment variables often escape newlines as string "\\n" so we need to replace them
        serviceAccount.private_key = envPrivateKey.replace(/\\n/g, '\n');
        logger.info('Using private key from environment variable');
      } else {
        logger.info('Using private key from service account file');
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      this.initialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error(`Firebase initialization error: ${error.message}`);
      throw error;
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

      notification.validate();

      const fcmPayload = notification.serialize();
      console.log('user', notification.user);
      if (!notification.user || !notification.user.device_id) {
        throw new Error('User must have an fcmToken property for FCM notification');
      }

      const token = notification.user.device_id;

      // Create the FCM message
      const message = {
        notification: fcmPayload.notification,
        data: fcmPayload.data,
      };

      // Determine if we're sending to a topic or a device token
      if (token.startsWith('/topics/')) {
        message.topic = token.replace('/topics/', '');
      } else {
        message.token = token;
      }

      // Send the notification to FCM
      const response = await admin.messaging().send(message);

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
   * Send FCM message with the new structure
   * @param {Object} message - The message object with token, notification, and data properties
   * @param {string} message.token - The FCM token of the device
   * @param {Object} message.notification - The notification payload
   * @param {string} message.notification.title - The notification title
   * @param {string} message.notification.body - The notification body
   * @param {Object} message.data - The data payload (all values must be strings)
   * @param {string} message.data.id - The notification ID
   * @param {string} message.data.state - The notification state
   * @param {string} message.data.metaData - JSON stringified metadata object
   * @param {string} message.data.dateHour - The notification timestamp
   * @returns {Promise<Object>} The FCM response
   */
  async sendMessage(message) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!message || !message.token || !message.notification) {
        throw new Error('Invalid message object. Must have token and notification properties.');
      }

      // Verify data properties are all strings as required by FCM
      if (message.data) {
        Object.keys(message.data).forEach(key => {
          if (typeof message.data[key] !== 'string') {
            message.data[key] = String(message.data[key]);
          }
        });
      }

      // Send the message to FCM
      const response = await admin.messaging().send(message);

      logger.info('FCM message sent successfully', { messageId: response });
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Failed to send FCM message', error);
      return {
        success: false,
        error: error.message,
        code: error.code || 'unknown_error',
      };
    }
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
