/** 
 * Temporary Notification Controller
 * 
 * This controller provides endpoints for testing notifications
 * through Postman or other API clients. 
 */
const ApiResponse = require('../../utils/apiResponse');
const FirebaseService = require('../../services/notifications/firebase.service');
const NotificationFactory = require('../../services/notifications/notification.factory');
const { User, Notification } = require('../../../models');

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

      let user = {device_id: to};

      if (user_id) {
        // Try to fetch user and get device_id
        const dbUser = await User.findByPk(user_id);

        if (!dbUser) {
          return res.status(404).json(
            ApiResponse.createApiResponse('User not found', [], ['User not found with the provided id'])
          );
        }else{
          user = dbUser;
        }
      }

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

      // Send notification using FCM
      // Log the notification data before sending
      console.log('notification', JSON.stringify(notification, null, 2));
      console.log('Before sending to FCM - notification data:', JSON.stringify(notification.getData(), null, 2));
      
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
          id_user: user ? user.id : null,
          type: notification.getType(),
          title: notification.getTitle(),
          message: notification.getBody(),
          data: notification.getData(),
          date_hour: new Date()
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

