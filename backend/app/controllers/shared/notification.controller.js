const ApiResponse = require('../../utils/apiResponse');
const ListNotificationsService = require('../../services/notifications/list-notifications.service');
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status; // Extract status parameter from query
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json(
          ApiResponse.createApiResponse(
            'Validation failed',
            [],
            [{ error: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100' }]
          )
        );
      }

      // Get paginated notifications for the user
      const result = await ListNotificationsService.getNotificationsForUserPaginated(userId, page, limit, status);
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
}

module.exports = new NotificationController();
