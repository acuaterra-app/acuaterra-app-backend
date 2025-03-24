const { Notification, User, Rol } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');
const { Op } = require('sequelize');

/**
 * Service for retrieving notifications for users with owner or monitor roles
 */
class ListNotificationsService {
  /**
   * Retrieve notifications for a user with owner or monitor role
   * @param {number} userId - The ID of the user requesting notifications
   * @returns {Promise<Array>} - A promise that resolves to an array of notifications
   */
  async getNotificationsForUser(userId) {
    try {
      // First, check if the user has the required roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Rol,
          attributes: ['id', 'name']
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has owner or monitor role
      const isOwnerOrMonitor = user.Rols.some(rol => 
        rol.id === ROLES.OWNER || rol.id === ROLES.MONITOR
      );

      if (!isOwnerOrMonitor) {
        throw new Error('Unauthorized: User does not have permission to view notifications');
      }

      // Get notifications for the user
      return await Notification.findAll({
        where: {
          id_user: userId,
          state: true // Assuming 'state' indicates active notifications
        },
        order: [['createdAt', 'DESC']] // Most recent notifications first
      });
    } catch (error) {
      console.error('Error in ListNotificationsService:', error.message);
      throw error;
    }
  }

  /**
   * Retrieve notifications for a user with owner or monitor role with pagination
   * @param {number} userId - The ID of the user requesting notifications
   * @param {number} page - The page number (starting from 1)
   * @param {number} limit - The number of items per page
   * @returns {Promise<Object>} - A promise that resolves to an object with notifications and pagination info
   */
  async getNotificationsForUserPaginated(userId, page = 1, limit = 10) {
    try {
      // First, check if the user has the required roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Rol,
          attributes: ['id', 'name']
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has owner or monitor role
      const isOwnerOrMonitor = user.Rols.some(rol => 
        rol.id === ROLES.OWNER || rol.id === ROLES.MONITOR
      );

      if (!isOwnerOrMonitor) {
        throw new Error('Unauthorized: User does not have permission to view notifications');
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count of notifications for pagination info
      const totalCount = await Notification.count({
        where: {
          id_user: userId,
          state: true // Assuming 'state' indicates active notifications
        }
      });

      // Get notifications for the user with pagination
      const notifications = await Notification.findAll({
        where: {
          id_user: userId,
          state: true // Assuming 'state' indicates active notifications
        },
        order: [['createdAt', 'DESC']], // Most recent notifications first
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications,
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

  /**
   * Mark a notification as read
   * @param {number} notificationId - The ID of the notification to mark as read
   * @param {number} userId - The ID of the user who owns the notification
   * @returns {Promise<boolean>} - A promise that resolves to true if successful
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      // Find the notification
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          id_user: userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found or does not belong to the user');
      }

      // Update the notification to mark it as read
      notification.read = true;
      await notification.save();

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }
  }
}

module.exports = new ListNotificationsService();

