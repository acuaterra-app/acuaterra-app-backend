const ApiResponse = require('../../utils/apiResponse');
const ListNotificationsService = require('../../services/notifications/list-notifications.service');
const NotificationService = require('../../services/notifications/notification.service');
const { ROLES } = require('../../enums/roles.enum');
class NotificationController {
  /**
  /**
   * Retrieve paginated notifications for the authenticated user
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {object} JSON response with notifications and pagination info
   */
  async index(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, state } = req.query;
      
      // Get paginated notifications for the user
      const result = await ListNotificationsService.getNotificationsForUserPaginated(userId, page, limit, state);
      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Notifications retrieved successfully',
          result.notifications,
          [],
          result.pagination
        )
      );
    } catch (error) {
      console.error('Error in index controller:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json(
          ApiResponse.createApiResponse(
            'User not found',
            [],
            [{ error: 'The requested user does not exist' }]
          )
        );
      }
      
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json(
          ApiResponse.createApiResponse(
            'Authorization failed',
            [],
            [{ error: 'You do not have permission to view these notifications' }]
          )
        );
      }
      
      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Server error',
          [],
          [{ error: 'Error retrieving notifications' }]
        )
      );
    }
  }

  /**
   * Mark a notification as read
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @returns {object} JSON response with the updated notification
   */
  async markAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Call the service to mark the notification as read
      const updatedNotification = await NotificationService.markAsRead(notificationId, userId);
      
      // Transform the notification to match ListNotificationsService structure
      // Transform the notification to match ListNotificationsService structure
      const notificationObj = updatedNotification.toJSON ? updatedNotification.toJSON() : updatedNotification;
      const { title, message, data: existingData = {}, date_hour, type, createdAt, updatedAt, id_user, ...rest } = notificationObj;
      // Create the transformed notification with the new structure
      const transformedNotification = {
        title,
        message,
        data: {
          ...rest, // Include all other properties (id, state, etc.)
          metaData: { type, ...existingData }, // Include existing data properties
          dateHour: date_hour // Rename date_hour to dateHour
        }
      };
      
      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Notification marked as read successfully',
          transformedNotification,
          []
        )
      );
    } catch (error) {
      console.error('Error in markAsRead controller:', error);
      
      if (error.message.includes('Notification with ID') && error.message.includes('not found')) {
        return res.status(404).json(
          ApiResponse.createApiResponse(
            'Notification not found',
            [],
            [{ error: 'The requested notification does not exist' }]
          )
        );
      }
      
      if (error.message === 'Notification does not belong to this user') {
        return res.status(403).json(
          ApiResponse.createApiResponse(
            'Authorization failed',
            [],
            [{ error: 'You do not have permission to update this notification' }]
          )
        );
      }
      
      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Server error',
          [],
          [{ error: 'Error updating notification' }]
        )
      );
    }
  }
}

module.exports = new NotificationController();
