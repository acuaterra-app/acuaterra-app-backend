/**
 * Temporary Notification Controller
 * 
 * This controller provides endpoints for testing notifications
 * through Postman or other API clients.
 */

const FirebaseService = require('../../services/firebase.service');
const BaseNotification = require('../../services/notifications/base-notification');

class NotificationController {
  /**
   * Send a direct notification to a specific device using FCM token
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async sendDirectNotification(req, res) {
    try {
      const { to, title, message, data = {} } = req.body;

      // Validate required parameters
      if (!to || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: to, title, and message are required'
        });
      }

      // Send notification using FCM
      // Create a simple BaseNotification-compatible object
      const notification = {
        serialize: () => ({
          to: to,
          notification: {
            title,
            body: message
          },
          data
        })
      };
      
      const result = await FirebaseService.sendNotification(notification);

      return res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        result
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();

