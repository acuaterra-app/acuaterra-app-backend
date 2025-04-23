const db = require('../../../models');
const { Notification, User } = db;
const FirebaseService = require('./firebase.service');
const { NOTIFICATION_STATE, getDefaultState } = require('../../enums/notification-state.enum');
const logger = require('../../utils/logger');

/**
 * Service to handle notification operations including saving to database
 * and sending through Firebase Cloud Messaging (FCM)
 */
class NotificationService {
  /**
   * Main entry point for creating and sending notifications
   * This method orchestrates saving to DB and sending via FCM within a transaction
   * 
   * @param {Object} payload - The notification payload
   * @param {number} payload.user_id - ID of the user to notify
   * @param {string} payload.title - Notification title
   * @param {string} payload.message - Notification message
   * @param {string} [payload.type='farm'] - Notification type
   * @param {Object} [payload.data={}] - Additional data for the notification
   * @returns {Promise<Object>} Object containing saved notification and FCM response
   */
  async saveAndSendNotification(payload) {
    try {
      // Validate the payload
      this.validatePayload(payload);
      
      // Execute within a transaction
      const result = await db.sequelize.transaction(async (transaction) => {
        // Step 1: Save notification to database
        const { savedNotification, user } = await this.saveNotificationToDB(payload, transaction);
        
        // Step 2: Send notification through FCM
        const fcmResponse = await this.sendNotificationToFCM(savedNotification, user, payload.data || {});
        
        return {
          notification: savedNotification,
          fcmResponse
        };
      });
      
      logger.info('Notification saved and sent successfully', {
        notificationId: result.notification.id,
        userId: payload.user_id
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to save and send notification', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
  
  /**
   * Validates the notification payload
   * 
   * @private
   * @param {Object} payload - The notification payload
   */
  validatePayload(payload) {
    const { user_id, title, message } = payload;
    
    if (!user_id) {
      throw new Error('user_id is required');
    }
    
    if (!title || !message) {
      throw new Error('title and message are required');
    }
  }
  
  /**
   * Saves the notification to the database
   * 
   * @private
   * @param {Object} payload - The notification payload
   * @param {Object} transaction - The Sequelize transaction
   * @returns {Promise<Object>} The saved notification and user
   */
  async saveNotificationToDB(payload, transaction) {
    const { user_id, title, message, type = 'farm', data = {} } = payload;
    
    // Find user to get device_id
    const user = await User.findByPk(user_id, { transaction });
    
    if (!user) {
      throw new Error(`User with ID ${user_id} not found`);
    }
    
    if (!user.device_id) {
      throw new Error(`User with ID ${user_id} has no device_id for FCM notifications`);
    }
    
    // Create notification in database
    const savedNotification = await Notification.create({
      id_user: user_id,
      title,
      message,
      type,
      data,
      date_hour: new Date(),
      state: getDefaultState()
    }, { transaction });
    
    return { savedNotification, user };
  }
  
  /**
   * Sends the notification through Firebase Cloud Messaging
   * 
   * @private
   * @param {Object} notification - The saved notification from the database
   * @param {Object} user - The user object
   * @param {Object} additionalData - Additional data to include in the FCM payload
   * @returns {Promise<Object>} FCM response
   */
  async sendNotificationToFCM(notification, user, additionalData = {}) {
    // Prepare FCM payload
    const fcmPayload = {
      to: user.device_id,
      notification: {
        title: notification.title,
        message: notification.message
      },
      data: {
        id: notification.id,
        state: notification.state,
        metaData: {
          type: notification.type,
          farmId: additionalData.farmId || null,
          messageType: additionalData.messageType || 'info'
        },
        dateHour: notification.date_hour.toISOString()
      }
    };
    
    return await this.sendToFCM(fcmPayload);
  }
  
  /**
   * Sends a notification through Firebase Cloud Messaging
   * 
   * @private
   * @param {Object} fcmPayload - The payload for FCM
   * @returns {Promise<Object>} FCM response
   */
  async sendToFCM(fcmPayload) {
    try {
      // Create the FCM message
      const message = {
        token: fcmPayload.to,
        notification: {
          title: fcmPayload.notification.title,
          body: fcmPayload.notification.message
        },
        data: {
          // Convert all values to strings as FCM only accepts string values in data
          id: String(fcmPayload.data.id),
          state: String(fcmPayload.data.state),
          metaData: JSON.stringify(fcmPayload.data.metaData),
          dateHour: String(fcmPayload.data.dateHour)
        }
      };
      
      // Send through Firebase service
      return await FirebaseService.sendMessage(message);
    } catch (error) {
      logger.error('Error sending FCM notification', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param {number} notificationId - ID of the notification to mark as read
   * @param {number} userId - ID of the user who owns the notification
   * @returns {Promise<Object>} The updated notification
   * @throws {Error} If notification not found or doesn't belong to the user
   */
  async markAsRead(notificationId, userId) {
    try {
      // Find the notification
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }
      
      // Verify the notification belongs to the user
      if (notification.id_user !== userId) {
        throw new Error('Notification does not belong to this user');
      }
      
      // Update the notification state to read
      notification.state = NOTIFICATION_STATE.READ;
      
      // Save the updated notification
      await notification.save();
      
      logger.info('Notification marked as read', {
        notificationId,
        userId
      });
      
      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error.message,
        stack: error.stack,
        notificationId,
        userId
      });
      
      throw error;
    }
  }
}

module.exports = new NotificationService();

