/** 
 * Power Alert Controller for Testing
 * 
 * This controller provides endpoints for simulating power/energy alerts
 * that would normally come from hardware sensors.
 */
const ApiResponse = require('../../utils/apiResponse');
const PowerAlertHandlerService = require('../../services/notifications/power-alert-handler.service');
const logger = require('../../utils/logger');

class PowerAlertController {
  /**
   * Simulate a power interruption event
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async simulatePowerOutage(req, res) {
    try {
      const { moduleId, eventType = 'outage', severity, metadata } = req.body;

      if (!moduleId) {
        return res.status(400).json(
          ApiResponse.createApiResponse(
            'moduleId is required', 
            [], 
            ['moduleId parameter is required to simulate power events']
          )
        );
      }

      const powerEvent = {
        moduleId: parseInt(moduleId),
        eventType: eventType,
        severity: severity || PowerAlertHandlerService.getSeverityForEventType(eventType),
        metadata: metadata || PowerAlertHandlerService.generateSimulationMetadata(eventType)
      };

      logger.info('Processing power alert simulation request', powerEvent);

      const result = await PowerAlertHandlerService.handlePowerAlert(powerEvent);

      if (!result.success) {
        return res.status(422).json(
          ApiResponse.createApiResponse(
            'Failed to process power alert', 
            [], 
            [result.message || 'Unknown error occurred']
          )
        );
      }

      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Power alert simulation completed successfully', 
          {
            event: powerEvent,
            result: result,
            notifiedUsers: result.notifiedUsers
          }
        )
      );

    } catch (error) {
      logger.error('Error simulating power alert', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      if (error.message.includes('Module not found')) {
        return res.status(404).json(
          ApiResponse.createApiResponse(
            'Module not found', 
            [], 
            [error.message]
          )
        );
      }

      if (error.message.includes('required')) {
        return res.status(400).json(
          ApiResponse.createApiResponse(
            'Invalid request parameters', 
            [], 
            [error.message]
          )
        );
      }

      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Internal server error while processing power alert', 
          [], 
          [error.message || 'Unknown server error']
        )
      );
    }
  }

  /**
   * Send a direct power alert to specific user(s)
   * @param {Request} req - Express request object  
   * @param {Response} res - Express response object
   */
  async sendDirectPowerAlert(req, res) {
    try {
      const { 
        to, 
        user_id, 
        moduleId, 
        eventType = 'outage', 
        severity = 'critical',
        title, 
        message,
        metadata = {} 
      } = req.body;

      if ((!to && !user_id) || !moduleId) {
        return res.status(400).json(
          ApiResponse.createApiResponse(
            'Missing required parameters', 
            [], 
            ['Either "to" (FCM token) or "user_id" is required, along with "moduleId"']
          )
        );
      }

      const NotificationService = require('../../services/notifications/notification.service');
      
      const alertTitle = title || PowerAlertHandlerService.generatePowerAlertTitle(eventType, severity);
      const alertMessage = message || `Alerta de energía simulada para módulo ${moduleId}. Tipo: ${eventType}.`;
      
      const notificationData = {
        moduleId: moduleId,
        eventType: eventType,
        severity: severity,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          source: 'direct_power_alert_simulation'
        }
      };

      let result;
      
      if (user_id) {
        result = await NotificationService.saveAndSendNotification({
          user_id: user_id,
          title: alertTitle,
          message: alertMessage,
          type: 'power_alert',
          data: notificationData
        });
      } else {
        const FirebaseService = require('../../services/notifications/firebase.service');
        const NotificationFactory = require('../../services/notifications/notification.factory');
        
        const user = { device_id: to };
        const notification = NotificationFactory.createNotification('power_alert', {
          user: user,
          title: alertTitle,
          message: alertMessage,
          data: notificationData
        });
        
        result = await FirebaseService.sendNotification(notification);
      }

      if (!result.success && result.success !== undefined) {
        return res.status(500).json(
          ApiResponse.createApiResponse(
            'Failed to send power alert notification', 
            [], 
            [result.error || 'Unknown FCM error']
          )
        );
      }

      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Direct power alert sent successfully', 
          {
            alert: {
              title: alertTitle,
              message: alertMessage,
              data: notificationData
            },
            result: result
          }
        )
      );

    } catch (error) {
      logger.error('Error sending direct power alert', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Error sending direct power alert', 
          [], 
          [error.message || 'Unknown server error']
        )
      );
    }
  }

  /**
   * Diagnose module users and notification eligibility
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async diagnoseModuleUsers(req, res) {
    try {
      const { moduleId } = req.params;

      if (!moduleId) {
        return res.status(400).json(
          ApiResponse.createApiResponse(
            'moduleId parameter is required', 
            [], 
            ['moduleId is required in URL path']
          )
        );
      }

      const { Module, User, ModuleUser } = require('../../../models');
      const { Op } = require('sequelize');

      const module = await Module.findByPk(moduleId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'device_id', 'isActive']
        }]
      });

      if (!module) {
        return res.status(404).json(
          ApiResponse.createApiResponse(
            'Module not found', 
            [], 
            [`Module with ID ${moduleId} not found`]
          )
        );
      }

      const allModuleUsers = await ModuleUser.findAll({
        where: { 
          id_module: moduleId
        },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'device_id', 'isActive'],
          required: true
        }]
      });

      const activeModuleUsers = await ModuleUser.findAll({
        where: { 
          id_module: moduleId,
          isActive: true
        },
        include: [{
          model: User,
          where: module.creator ? { 
            id: { [Op.ne]: module.creator.id },
            isActive: true 
          } : { isActive: true },
          attributes: ['id', 'name', 'email', 'device_id', 'isActive'],
          required: true
        }]
      });

      const allUsers = allModuleUsers.map(mu => ({
        userId: mu.User.id,
        name: mu.User.name,
        email: mu.User.email,
        device_id: mu.User.device_id,
        userActive: mu.User.isActive,
        moduleUserActive: mu.isActive,
        canReceiveNotifications: !!(mu.User.device_id && mu.User.isActive && mu.isActive),
        role: mu.User.id === module.creator?.id ? 'creator' : 'monitor'
      }));

      const eligibleUsers = activeModuleUsers
        .map(mu => mu.User)
        .filter(user => user.device_id);

      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Module user diagnosis completed', 
          {
            module: {
              id: module.id,
              name: module.name,
              creatorId: module.creator?.id
            },
            creator: {
              id: module.creator?.id,
              name: module.creator?.name,
              email: module.creator?.email,
              hasDeviceId: !!module.creator?.device_id,
              isActive: module.creator?.isActive,
              willReceiveNotification: !!(module.creator?.device_id && module.creator?.isActive)
            },
            summary: {
              totalUsersInModuleUser: allUsers.length,
              activeEligibleMonitors: eligibleUsers.length,
              expectedTotalNotifications: (module.creator?.device_id && module.creator?.isActive ? 1 : 0) + eligibleUsers.length
            },
            allAssociatedUsers: allUsers,
            eligibleMonitorUsers: eligibleUsers.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              hasDeviceId: !!u.device_id
            }))
          }
        )
      );

    } catch (error) {
      logger.error('Error diagnosing module users', {
        error: error.message,
        stack: error.stack,
        moduleId: req.params.moduleId
      });

      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Error diagnosing module users', 
          [], 
          [error.message || 'Unknown server error']
        )
      );
    }
  }

  /**
   * Get available power event types for simulation
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAvailableEventTypes(req, res) {
    try {
      const eventTypes = {
        'outage': {
          name: 'Interrupción Eléctrica',
          description: 'Falta total de energía eléctrica',
          severity: 'critical',
          example: {
            moduleId: 1,
            eventType: 'outage',
            severity: 'critical'
          }
        },
        'restored': {
          name: 'Energía Restaurada',
          description: 'La energía eléctrica ha sido restaurada',
          severity: 'info',
          example: {
            moduleId: 1,
            eventType: 'restored',
            severity: 'info'
          }
        },
        'low_battery': {
          name: 'Batería Baja',
          description: 'El nivel de batería de respaldo está bajo',
          severity: 'warning',
          example: {
            moduleId: 1,
            eventType: 'low_battery',
            severity: 'warning'
          }
        },
        'voltage_drop': {
          name: 'Caída de Voltaje',
          description: 'Se detectó una caída significativa en el voltaje',
          severity: 'warning',
          example: {
            moduleId: 1,
            eventType: 'voltage_drop',
            severity: 'warning'
          }
        },
        'power_fluctuation': {
          name: 'Fluctuación de Energía',
          description: 'Se detectaron fluctuaciones en el suministro eléctrico',
          severity: 'warning',
          example: {
            moduleId: 1,
            eventType: 'power_fluctuation',
            severity: 'warning'
          }
        }
      };

      return res.status(200).json(
        ApiResponse.createApiResponse(
          'Available power event types retrieved successfully', 
          {
            eventTypes: eventTypes,
            usage: {
              simulate: {
                endpoint: 'POST /api/v2/temp/power-alerts/simulate',
                description: 'Simulate a power event for a specific module'
              },
              direct: {
                endpoint: 'POST /api/v2/temp/power-alerts/send-direct',
                description: 'Send a direct power alert to a specific user or device'
              }
            }
          }
        )
      );
    } catch (error) {
      logger.error('Error retrieving event types', error);
      return res.status(500).json(
        ApiResponse.createApiResponse(
          'Error retrieving event types', 
          [], 
          [error.message]
        )
      );
    }
  }
}

module.exports = new PowerAlertController();

