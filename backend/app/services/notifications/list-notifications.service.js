const { Notification, User, Rol } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');
const { Op } = require('sequelize');
const {NOTIFICATION_STATE} = require("../../enums/notification-state.enum");

/**
 * Service for retrieving notifications for users with owner or monitor roles
 */
class ListNotificationsService {

  async getNotificationsForUserPaginated(userId, page = 1, limit = 10, state = null) {
    try {
      // First, check if the user has the required roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id', 'name']
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      const offset = (page - 1) * limit;

      // Build where clause based on state parameter
      const whereClause = {
        id_user: userId
      };

      // If state is provided and valid, add state filter
      if (state === 'read') {
        whereClause.state = NOTIFICATION_STATE.READ;
      } else if (state === 'unread') {
        whereClause.state = NOTIFICATION_STATE.UNREAD;
      }
      // When no state is provided, we'll return all notifications but with custom ordering

      // Get total count of notifications for pagination info
      const totalCount = await Notification.count({
        where: whereClause
      });

      // Define the ordering based on the state parameter
      let orderCriteria;
      if (state === null) {
        // When no state is provided, order by state (unread first) and then by createdAt (newest first)
        orderCriteria = [
          ['state', 'DESC'], // DESC ordering puts 'unread' before 'read' alphabetically
          ['createdAt', 'DESC']
        ];
      } else {
        // When a state filter is applied, just order by createdAt
        orderCriteria = [['createdAt', 'DESC']];
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        attributes: ['id', 'type', 'title', 'message', 'data', 'date_hour', 'state'],
        order: orderCriteria,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Transform notification data structure
      const transformedNotifications = notifications.map(notification => {
        const notificationObj = notification.toJSON();
        const { title, message, data: existingData = {}, date_hour, type, ...rest } = notificationObj;
        
        // Prepare the transformed notification with the new structure
        return {
          title,
          message,
          data: {
            ...rest, // Include all other properties (id, type, state, etc.)
            metaData: {type, ...existingData}, // Include existing data properties (farmId, messageType, etc.)
            dateHour: date_hour // Rename date_hour to dateHour
          }
        };
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications: transformedNotifications,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error in ListNotificationsService:', error.message);
      throw error;
    }
  }
}

module.exports = new ListNotificationsService();

