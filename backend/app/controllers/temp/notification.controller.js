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
      const { title, body, token, data = {} } = req.body;

      // Validate required parameters
      if (!title || !body || !token) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: title, body, and token are required'
        });
      }

      // Prepare notification payload
      const message = {
        notification: {
          title,
          body,
        },
        data,
        token,
      };

      // Send notification using FCM
      // Create a simple BaseNotification-compatible object
      const notification = {
        serialize: () => ({
          to: token,
          notification: {
            title,
            body
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

  /**
   * Send a notification to multiple devices using FCM tokens
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async sendMulticastNotification(req, res) {
    try {
      const { title, body, tokens, data = {} } = req.body;

      // Validate required parameters
      if (!title || !body || !tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: title, body, and tokens array are required'
        });
      }

      // Prepare notification payload
      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens,
      };

      // Send multicast notification using FCM
      // Create an array of BaseNotification-compatible objects
      const notifications = tokens.map(token => ({
        serialize: () => ({
          to: token,
          notification: {
            title,
            body
          },
          data
        })
      }));
      
      const result = await FirebaseService.sendMulticastNotification(notifications);

      return res.status(200).json({
        success: true,
        message: 'Multicast notification sent successfully',
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount,
        }
      });
    } catch (error) {
      console.error('Error sending multicast notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send multicast notification',
        error: error.message
      });
    }
  }

  /**
   * Send a notification to a topic
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async sendTopicNotification(req, res) {
    try {
      const { title, body, topic, data = {} } = req.body;

      // Validate required parameters
      if (!title || !body || !topic) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: title, body, and topic are required'
        });
      }

      // Prepare notification payload
      const message = {
        notification: {
          title,
          body,
        },
        data,
        topic,
      };

      // Send topic notification using FCM
      // Create a simple BaseNotification-compatible object for topic
      const notification = {
        serialize: () => ({
          to: `/topics/${topic}`,
          notification: {
            title,
            body
          },
          data
        })
      };
      
      const result = await FirebaseService.sendNotification(notification);

      return res.status(200).json({
        success: true,
        message: 'Topic notification sent successfully',
        result
      });
    } catch (error) {
      console.error('Error sending topic notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send topic notification',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();

