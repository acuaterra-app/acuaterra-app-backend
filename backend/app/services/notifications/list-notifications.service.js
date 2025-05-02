const { Notification, User, Rol, ModuleUser } = require('../../../models');
const { ROLES } = require('../../enums/roles.enum');
const { Op, Sequelize } = require('sequelize');
const {NOTIFICATION_STATE} = require("../../enums/notification-state.enum");

/**
 * Service for retrieving notifications for users with owner or monitor roles
 */
class ListNotificationsService {

  async getNotificationsForUserPaginated(userId, page = 1, limit = 10, state = null) {
    try {
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

      let whereClause = {};
      
      if (user.rol.id === ROLES.MONITOR) {
        const assignedModules = await ModuleUser.findAll({
          where: {
            id_user: userId,
            isActive: true
          },
          attributes: ['id_module']
        });
        
        const moduleIds = assignedModules.map(module => module.id_module);
        
        if (moduleIds.length === 0) {
          whereClause.id_user = userId;
        } else {
          whereClause = {
            [Op.or]: [
              { id_user: userId },
              {
                [Op.and]: [
                  {
                    type: {
                      [Op.in]: ['module_alert', 'sensor_reading', 'module_notification', 'sensor_alert']
                    }
                  },
                  {
                    [Op.or]: [
                      Sequelize.literal(`JSON_EXTRACT(data, '$.moduleId') IN (${moduleIds.join(',')})`),
                      Sequelize.literal(`JSON_EXTRACT(data, '$.id_module') IN (${moduleIds.join(',')})`)
                    ]
                  }
                ]
              }
            ]
          };
        }
      } else {
        whereClause.id_user = userId;
      }
      
      if (state === 'read') {
        whereClause.state = NOTIFICATION_STATE.READ;
      } else if (state === 'unread') {
        whereClause.state = NOTIFICATION_STATE.UNREAD;
      }

      const totalCount = await Notification.count({
        where: whereClause
      });

      let orderCriteria;
      if (state === null) {
        orderCriteria = [
          ['state', 'DESC'],
          ['createdAt', 'DESC']
        ];
      } else {
        orderCriteria = [['createdAt', 'DESC']];
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        attributes: ['id', 'type', 'title', 'message', 'data', 'date_hour', 'state'],
        order: orderCriteria,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const transformedNotifications = notifications.map(notification => {
        const notificationObj = notification.toJSON();
        const { title, message, data: existingData = {}, date_hour, type, ...rest } = notificationObj;
        
        return {
          title,
          message,
          data: {
            ...rest,
            metaData: {type, ...existingData},
            dateHour: date_hour
          }
        };
      });

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

