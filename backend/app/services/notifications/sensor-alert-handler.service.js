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

      const module = await Module.findByPk(measurement.moduleId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'device_id']
        }]
      });

      if (!module) {
        throw new Error(`Module not found with ID ${measurement.moduleId}`);
      }

      if (!module.creator) {
        logger.warn(`No creator found for module ${measurement.moduleId}`);
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
            moduleId: measurement.moduleId,
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
        const associatedUsers = await this.getUsersForModule(measurement.moduleId);
        
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
        logger.warn(`Error retrieving associated users for module ${measurement.moduleId}: ${error.message}`);
      }

      if (notifiedUsers.length === 0) {
        logger.warn(`No notifications were sent for module ${measurement.moduleId} as no users with device_id were found`);
        return {
          success: true,
          message: 'Alert processed but no notifications were sent (no users with device_id)',
          notifiedUsers: []
        };
      }

      logger.info('Sensor alerts processed successfully', {
        moduleId: measurement.moduleId,
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

  async getUsersForModule(moduleId) {
    try {
      const moduleUsers = await ModuleUser.findAll({
        where: { moduleId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'device_id']
        }]
      });

      if (!moduleUsers || moduleUsers.length === 0) {
        logger.warn(`No users found for module ${moduleId}`);
        return [];
      }

      const users = moduleUsers.map(mu => mu.User).filter(user => user);
      
      logger.info(`Found ${users.length} users associated with module ${moduleId}`);
      logger.debug(`Users with device_id: ${users.filter(user => user.device_id).length} of ${users.length}`);
      
      return users;
    } catch (error) {
      logger.error('Error getting users for module', {
        moduleId,
        error: error.message
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

