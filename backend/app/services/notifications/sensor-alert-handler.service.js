const NotificationService = require('./notification.service');
const NotificationFactory = require('./notification.factory');
const logger = require('../../utils/logger');
const { Module, User, ModuleUser } = require('../../../models');

class SensorAlertHandlerService {

  async handleSensorAlert(measurement, thresholdInfo) {
    try {
      if (!thresholdInfo.isOutOfThreshold) {
        return {
          success: true,
          message: 'The measurement is within the allowed thresholds'
        };
      }

      const moduleIdParam = measurement.id_module || measurement.moduleId;
      const module = await Module.findByPk(moduleIdParam, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'device_id']
        }]
      });

      if (!module) {
        const moduleIdParam = measurement.id_module || measurement.moduleId;
        throw new Error(`Module not found with ID ${moduleIdParam}`);
      }

      if (!module.creator) {
        const moduleIdParam = measurement.id_module || measurement.moduleId;
        logger.warn(`No creator found for module ${moduleIdParam}`);
        return {
          success: false,
          message: 'Module creator not found'
        };
      }

      const title = this.generateAlertTitle(measurement.sensorType);
      const message = this.generateAlertMessage(measurement, thresholdInfo);

      const notificationData = {
        moduleId: measurement.moduleId,
        moduleName: module.name,
        sensorType: measurement.sensorType,
        value: measurement.value,
        timestamp: measurement.timestamp,
        threshold: {
          min: thresholdInfo.min,
          max: thresholdInfo.max
        }
      };

      const notifiedUsers = [];
      
      if (module.creator.device_id) {
        try {
          const notification = NotificationFactory.createNotification('sensor_alert', {
            user: module.creator,
            title,
            message,
            data: notificationData
          });
          
          await NotificationService.saveAndSendNotification({
            user_id: module.creator.id,
            title,
            message,
            type: notification.getType(),
            data: notificationData
          });
          notifiedUsers.push(module.creator.id);
          logger.info('Sensor alert sent to owner successfully', {
            moduleId: measurement.id_module || measurement.moduleId,
            sensorType: measurement.sensorType,
            creatorId: module.creator.id
          });
        } catch (error) {
          logger.warn(`Error sending notification to owner (ID: ${module.creator.id}): ${error.message}`);
        }
      } else {
        logger.warn(`Owner (ID: ${module.creator.id}) does not have device_id configured, skipping notification`);
      }
      
      try {
        const moduleIdParam = measurement.id_module || measurement.moduleId;
        logger.info(`Retrieving monitor users for module ${moduleIdParam}`);
        const associatedUsers = await this.getUsersForModule(moduleIdParam);
        
        for (const user of associatedUsers) {
          if (user.id === module.creator.id) {
            continue;
          }
          
          if (user.device_id) {
            try {
              const notification = NotificationFactory.createNotification('sensor_alert', {
                user: user,
                title,
                message,
                data: notificationData
              });
              
              await NotificationService.saveAndSendNotification({
                user_id: user.id,
                title,
                message,
                type: notification.getType(),
                data: notificationData
              });
              notifiedUsers.push(user.id);
              logger.info(`Sensor alert sent to associated user (ID: ${user.id})`);
            } catch (error) {
              logger.warn(`Error sending notification to user (ID: ${user.id}): ${error.message}`);
            }
          } else {
            logger.warn(`Associated user (ID: ${user.id}) does not have device_id configured, skipping notification`);
          }
        }
      } catch (error) {
        const moduleIdParam = measurement.id_module || measurement.moduleId;
        logger.warn(`Error retrieving associated users for module ${moduleIdParam}: ${error.message}`);
      }

      if (notifiedUsers.length === 0) {
        const moduleIdParam = measurement.id_module || measurement.moduleId;
        logger.warn(`No notifications were sent for module ${moduleIdParam} as no users with device_id were found`);
        return {
          success: true,
          message: 'Alert processed but no notifications were sent (no users with device_id)',
          notifiedUsers: []
        };
      }

      logger.info('Sensor alerts processed successfully', {
        moduleId: measurement.id_module || measurement.moduleId,
        sensorType: measurement.sensorType,
        value: measurement.value,
        notifiedUsers: notifiedUsers
      });

      return {
        success: true,
        message: 'Alert sent successfully',
        notifiedUsers: notifiedUsers
      };
    } catch (error) {
      logger.error('Error handling sensor alert', {
        error: error.message,
        measurement,
        thresholdInfo
      });
      
      throw error;
    }
  }

  async getUsersForModule(id_module) {
    try {
      logger.debug(`Retrieving active monitor users for module ID: ${id_module}`);
      
      const moduleUsers = await ModuleUser.findAll({
        where: { 
          id_module,
          isActive: true
        },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'device_id'],
          required: true
        }]
      });

      if (!moduleUsers || moduleUsers.length === 0) {
        logger.warn(`No active users found for module ${id_module}`);
        return [];
      }

      const users = moduleUsers
        .map(mu => mu.User)
        .filter(user => user);
        
      const usersWithDeviceId = users.filter(user => user.device_id);
      
      logger.info(`Found ${users.length} active users associated with module ${id_module}`);
      logger.info(`Users with device_id: ${usersWithDeviceId.length} of ${users.length}`);
      
      if (users.length > 0 && usersWithDeviceId.length === 0) {
        logger.warn('Found active users for module but none have device_id configured');
      }
      
      return usersWithDeviceId;
    } catch (error) {
      logger.error('Error getting users for module', {
        id_module,
        error: error.message,
        stack: error.stack
      });
      return [];
    }
  }

  generateAlertTitle(sensorType) {
    const sensorNames = {
      'temperature': 'Temperatura',
      'humidity': 'Humedad',
      'ph': 'pH',
      'turbidity': 'Turbidez',
      'oxygen': 'Oxígeno',
      'proximity': 'Proximidad'
    };

    const sensorName = sensorNames[sensorType] || sensorType;
    return `Alert ${sensorName}`;
  }

  generateAlertMessage(measurement, thresholdInfo) {
    const { value, sensorType } = measurement;
    const { min, max } = thresholdInfo;

    let condition = '';
    if (value < min) {
      condition = 'below the minimum';
    } else if (value > max) {
      condition = 'above the maximum';
    } else {
      condition = 'out of range';
    }

    const units = this.getSensorUnits(sensorType);
    
    return `Value of ${value}${units} is ${condition}. Allowed range: ${min}-${max}${units}`;
  }

  getSensorUnits(sensorType) {
    const sensorUnits = {
      'temperature': '°C',
      'humidity': '%',
      'ph': '',
      'turbidity': 'NTU',
      'oxygen': 'mg/L',
      'proximity': 'cm'
    };

    return sensorUnits[sensorType] || '';
  }
}

module.exports = new SensorAlertHandlerService();

