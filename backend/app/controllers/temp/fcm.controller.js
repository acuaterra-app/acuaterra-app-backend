/** 
 * Temporary Notification Controller
 * 
 * This controller provides endpoints for testing notifications
 * through Postman or other API clients. 
 */
const ApiResponse = require('../../utils/apiResponse');
const FirebaseService = require('../../services/notifications/firebase.service');
const NotificationFactory = require('../../services/notifications/notification.factory');
const NotificationService = require('../../services/notifications/notification.service');
const { User, Notification } = require('../../../models');
const {NOTIFICATION_STATE} = require("../../enums/notification-state.enum");

class FcmController {
  /**
   * Send a direct notification to a specific device using FCM token
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async sendDirectNotification(req, res) {
    try {
      const { to, user_id, title, message, type = 'farm', data = {} } = req.body;

      // Validate required parameters
      if ((!to && !user_id) || !title || !message) {
        return res.status(400).json(
          ApiResponse.createApiResponse('Missing required parameters: recipient (to or user_id), title, and message are required', [], ['Required parameters missing'])
        );
      }

      // If user_id is provided, use NotificationService to save and send the notification
      if (user_id) {
        try {
          // Call notification service to save and send notification
          const result = await NotificationService.saveAndSendNotification({
            user_id,
            title,
            message,
            type,
            data
          });

          return res.status(200).json(
            ApiResponse.createApiResponse('Notification sent successfully', result)
          );
        } catch (error) {
          console.error('Error using NotificationService:', error);

          // Handle specific error cases
          if (error.message.includes('user_id is required') || 
              error.message.includes('title and message are required')) {
            return res.status(400).json(
              ApiResponse.createApiResponse('Invalid request parameters', [], [error.message])
            );
          }

          if (error.message.includes('not found')) {
            return res.status(404).json(
              ApiResponse.createApiResponse('User not found', [], [error.message])
            );
          }

          if (error.message.includes('no device_id') || error.message.includes('has no device_id')) {
            return res.status(422).json(
              ApiResponse.createApiResponse('User has no registered device', [], [error.message])
            );
          }

          // Generic error response
          return res.status(500).json(
            ApiResponse.createApiResponse('Failed to send notification', [], [error.message])
          );
        }
      }
      
      // If only 'to' is provided, use the direct Firebase approach
      // This part preserves the existing direct notification capability
      let user = {device_id: to};
      let notification;
      
      // Log the data payload for debugging
      console.log('Original data payload being sent to notification:', JSON.stringify(data, null, 2));
      
      try {
        // Prepare payload for the factory
        const payload = {
          user: user,
          title,
          message,
          data
        };

        // Use factory to create proper notification type
        notification = NotificationFactory.createNotification(type, payload);
      } catch (error) {
        return res.status(400).json(
          ApiResponse.createApiResponse('Failed to create notification', [], [error.message])
        );
      }

      const result = await FirebaseService.sendNotification(notification);

      if (!result.success) {
        console.log('FCM Error Result:', JSON.stringify(result, null, 2));
        return res.status(500).json(
          ApiResponse.createApiResponse('Failed to send notification', [], [result.error || 'Unknown error'])
        );
      }

      // Save notification to database after successful sending
      try {
        const savedNotification = await Notification.create({
          id_user: null, // No user ID for direct notifications
          type: notification.getType(),
          title: notification.getTitle(),
          message: notification.getBody(),
          data: notification.getData(),
          date_hour: new Date(),
          state: NOTIFICATION_STATE.UNREAD,
        });

        return res.status(200).json(
          ApiResponse.createApiResponse('Notification sent successfully', {
            notification: savedNotification,
            fcm_result: result
          })
        );
      } catch (dbError) {
        console.error('Error saving notification to database:', dbError);
        // Still return success if FCM succeeded but DB save failed
        return res.status(200).json(
          ApiResponse.createApiResponse('Notification sent but failed to save to database', result, [dbError.message])
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json(
        ApiResponse.createApiResponse('Error! Failed to send notification', [], [error.toString()])
      );
    }
  }
}

module.exports = new FcmController();

