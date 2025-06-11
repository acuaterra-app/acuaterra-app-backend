const NotificationService = require('./notification.service');
const NotificationFactory = require('./notification.factory');
const logger = require('../../utils/logger');
const { Module, User, ModuleUser } = require('../../../models');

/**
 * Service to handle power/energy related alerts
 * Simulates sensor behavior for power interruption events
 */
class PowerAlertHandlerService {

  /**
   * Handle power interruption alert
   * @param {Object} powerEvent - Power event data
   * @param {number} powerEvent.moduleId - ID of the affected module
   * @param {string} powerEvent.eventType - Type of power event ('outage', 'restored', 'low_battery')
   * @param {string} [powerEvent.severity='warning'] - Severity level ('info', 'warning', 'error', 'critical')
   * @param {Object} [powerEvent.metadata={}] - Additional metadata
   * @returns {Promise<Object>} Result of the alert processing
   */
  async handlePowerAlert(powerEvent) {
    try {
      const { moduleId, eventType, severity = 'warning', metadata = {} } = powerEvent;

      if (!moduleId) {
        throw new Error('moduleId is required for power alerts');
      }

      if (!eventType) {
        throw new Error('eventType is required for power alerts');
      }

      const module = await Module.findByPk(moduleId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'device_id']
        }]
      });

      if (!module) {
        throw new Error(`Module not found with ID ${moduleId}`);
      }

      if (!module.creator) {
        logger.warn(`No creator found for module ${moduleId}`);
        return {
          success: false,
          message: 'Module creator not found'
        };
      }

      const title = this.generatePowerAlertTitle(eventType, severity);
      const message = this.generatePowerAlertMessage(eventType, module.name, metadata);

      const notificationData = {
        moduleId: moduleId,
        moduleName: module.name,
        eventType: eventType,
        severity: severity,
        timestamp: new Date().toISOString(),
        metadata: metadata
      };

      const notifiedUsers = [];
      
      if (module.creator.device_id) {
        try {
          await NotificationService.saveAndSendNotification({
            user_id: module.creator.id,
            title,
            message,
            type: 'power_alert',
            data: notificationData
          });
          notifiedUsers.push(module.creator.id);
          logger.info('Power alert sent to owner successfully', {
            moduleId: moduleId,
            eventType: eventType,
            creatorId: module.creator.id
          });
        } catch (error) {
          logger.warn(`Error sending power alert to owner (ID: ${module.creator.id}): ${error.message}`);
        }
      } else {
        logger.warn(`Owner (ID: ${module.creator.id}) does not have device_id configured, skipping notification`);
      }
      
      try {
        logger.info(`Retrieving monitor users for module ${moduleId}, excluding owner (ID: ${module.creator.id})`);
        const associatedUsers = await this.getUsersForModule(moduleId, module.creator.id);
        
        for (const user of associatedUsers) {
          if (user.device_id) {
            try {
              await NotificationService.saveAndSendNotification({
                user_id: user.id,
                title,
                message,
                type: 'power_alert',
                data: notificationData
              });
              notifiedUsers.push(user.id);
              logger.info(`Power alert sent to associated user (ID: ${user.id})`);
            } catch (error) {
              logger.warn(`Error sending power alert to user (ID: ${user.id}): ${error.message}`);
            }
          } else {
            logger.warn(`Associated user (ID: ${user.id}) does not have device_id configured, skipping notification`);
          }
        }
      } catch (error) {
        logger.warn(`Error retrieving associated users for module ${moduleId}: ${error.message}`);
      }

      if (notifiedUsers.length === 0) {
        logger.warn(`No power alert notifications were sent for module ${moduleId} as no users with device_id were found`);
        return {
          success: true,
          message: 'Power alert processed but no notifications were sent (no users with device_id)',
          notifiedUsers: []
        };
      }

      logger.info('Power alerts processed successfully', {
        moduleId: moduleId,
        eventType: eventType,
        severity: severity,
        notifiedUsers: notifiedUsers
      });

      return {
        success: true,
        message: 'Power alert sent successfully',
        notifiedUsers: notifiedUsers,
        alertData: notificationData
      };
    } catch (error) {
      logger.error('Error handling power alert', {
        error: error.message,
        powerEvent
      });
      
      throw error;
    }
  }

  /**
   * Retrieves active users for a module, excluding the module creator (owner)
   * 
   * @param {number} id_module - The module ID to fetch users for
   * @param {number} creatorId - The ID of the module creator to exclude
   * @returns {Promise<Array>} - Array of users with device_id
   */
  async getUsersForModule(id_module, creatorId) {
    try {
      const { Op } = require('sequelize');
      logger.debug(`Retrieving active monitor users for module ID: ${id_module}, excluding creator ID: ${creatorId}`);
      
      const moduleUsers = await ModuleUser.findAll({
        where: { 
          id_module,
          isActive: true
        },
        include: [{
          model: User,
          where: creatorId ? { id: { [Op.ne]: creatorId } } : {}, // Exclude creator if creatorId provided
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

  /**
   * Generate alert title based on power event type and severity
   * @param {string} eventType - Type of power event
   * @param {string} severity - Severity level
   * @returns {string} Alert title
   */
  generatePowerAlertTitle(eventType, severity) {
    const eventTitles = {
      'outage': 'Interrupción Eléctrica',
      'restored': 'Energía Restaurada',
      'low_battery': 'Batería Baja',
      'voltage_drop': 'Caída de Voltaje',
      'power_fluctuation': 'Fluctuación de Energía'
    };

    const severityPrefix = {
      'info': '📘',
      'warning': '⚠️',
      'error': '🔴',
      'critical': '🚨'
    };

    const eventTitle = eventTitles[eventType] || 'Alerta de Energía';
    const prefix = severityPrefix[severity] || '⚠️';
    
    return `${prefix} ${eventTitle}`;
  }

  /**
   * Generate alert message based on power event details
   * @param {string} eventType - Type of power event
   * @param {string} moduleName - Name of the affected module
   * @param {Object} metadata - Additional metadata
   * @returns {string} Alert message
   */
  generatePowerAlertMessage(eventType, moduleName, metadata = {}) {
    const eventMessages = {
      'outage': `Se ha detectado una interrupción eléctrica en el módulo "${moduleName}". El sistema está funcionando con energía de respaldo.`,
      'restored': `La energía eléctrica ha sido restaurada en el módulo "${moduleName}". El sistema ha vuelto a la operación normal.`,
      'low_battery': `El nivel de batería del módulo "${moduleName}" está bajo. Se requiere atención inmediata.`,
      'voltage_drop': `Se ha detectado una caída de voltaje en el módulo "${moduleName}". Revisar el suministro eléctrico.`,
      'power_fluctuation': `Se han detectado fluctuaciones en el suministro eléctrico del módulo "${moduleName}".`
    };

    let message = eventMessages[eventType] || `Evento de energía detectado en el módulo "${moduleName}".`;
    
    if (metadata.batteryLevel) {
      message += ` Nivel de batería: ${metadata.batteryLevel}%.`;
    }
    
    if (metadata.estimatedDuration) {
      message += ` Duración estimada: ${metadata.estimatedDuration}.`;
    }
    
    if (metadata.affectedSensors && metadata.affectedSensors.length > 0) {
      message += ` Sensores afectados: ${metadata.affectedSensors.join(', ')}.`;
    }
    
    return message;
  }

  /**
   * Simulate different types of power events for testing
   * @param {number} moduleId - Module ID to simulate event for
   * @param {string} [eventType='outage'] - Type of event to simulate
   * @returns {Promise<Object>} Result of the simulated event
   */
  async simulatePowerEvent(moduleId, eventType = 'outage') {
    const simulationData = {
      moduleId: moduleId,
      eventType: eventType,
      severity: this.getSeverityForEventType(eventType),
      metadata: this.generateSimulationMetadata(eventType)
    };

    logger.info('Simulating power event', simulationData);
    
    return await this.handlePowerAlert(simulationData);
  }

  /**
   * Get appropriate severity for event type
   * @param {string} eventType - Type of power event
   * @returns {string} Severity level
   */
  getSeverityForEventType(eventType) {
    const severityMap = {
      'outage': 'critical',
      'restored': 'info',
      'low_battery': 'warning',
      'voltage_drop': 'warning',
      'power_fluctuation': 'warning'
    };
    
    return severityMap[eventType] || 'warning';
  }

  /**
   * Generate realistic metadata for simulation
   * @param {string} eventType - Type of power event
   * @returns {Object} Simulation metadata
   */
  generateSimulationMetadata(eventType) {
    const baseMetadata = {
      timestamp: new Date().toISOString(),
      source: 'power_sensor_simulation',
      location: 'sensor_grid'
    };

    switch (eventType) {
      case 'outage':
        return {
          ...baseMetadata,
          batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
          estimatedDuration: 'Desconocida',
          affectedSensors: ['power_monitor', 'main_supply']
        };
      case 'low_battery':
        return {
          ...baseMetadata,
          batteryLevel: Math.floor(Math.random() * 20) + 5, // 5-25%
          estimatedDuration: '30-60 minutos',
          affectedSensors: ['battery_monitor']
        };
      case 'restored':
        return {
          ...baseMetadata,
          batteryLevel: 100,
          estimatedDuration: 'N/A',
          affectedSensors: []
        };
      default:
        return baseMetadata;
    }
  }
}

module.exports = new PowerAlertHandlerService();

