const NotificationService = require('./notification.service');
const NotificationFactory = require('./notification.factory');
const logger = require('../../utils/logger');
const { Module, User, UserModule } = require('../../../models');

class SensorAlertHandlerService {

  async handleSensorAlert(measurement, thresholdInfo) {
    try {
      if (!thresholdInfo.isOutOfThreshold) {
        return {
          success: true,
          message: 'The measurement is within the allowed thresholds'
        };
      }

      const module = await Module.findByPk(measurement.moduleId);
      if (!module) {
        throw new Error(`The cons module was not found ID ${measurement.moduleId}`);
      }

      const users = await this.getUsersForModule(measurement.moduleId);
      if (!users || users.length === 0) {
        logger.warn(`No users associated with the module were found ${measurement.moduleId}`);
        return {
          success: false,
          message: 'There are no users to notify'
        };
      }

      const title = this.generateAlertTitle(measurement.sensorType);
      const message = this.generateAlertMessage(measurement, thresholdInfo);

      const notificationPromises = users.map(user => {
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

        const notification = NotificationFactory.createNotification('sensor_alert', {
          user,
          title,
          message,
          data: notificationData
        });

        // Use the notification service with the created notification
        return NotificationService.saveAndSendNotification({
          user_id: user.id,
          title: notification.getTitle(),
          message: notification.getBody(),
          type: notification.getType(),
          data: notificationData
        });
      });

      await Promise.all(notificationPromises);
      
      logger.info('Sensor alerts sent successfully', {
        moduleId: measurement.moduleId,
        sensorType: measurement.sensorType,
        value: measurement.value,
        usersNotified: users.length
      });

      return {
        success: true,
        message: `Alerts sent to ${users.length} user(s)`,
        usersNotified: users.length
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
      const userModules = await UserModule.findAll({
        where: { moduleId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'device_id']
        }]
      });

      return userModules.map(um => um.User).filter(user => user.device_id);
    } catch (error) {
      logger.error('Error getting users for module', {
        moduleId,
        error: error.message
      });
      throw error;
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

