/**
 * @fileoverview Notifications module - exports all notification classes and utilities
 * This module provides a unified API for sending various types of FCM notifications
 */

const BaseNotification = require('./base-notification');
const ModuleNotification = require('./module-notification');
const HighMeasurementNotification = require('./high-measurement-notification');
const FarmNotification = require('./farm-notification');
const FirebaseService = require('../firebase.service');

/**
 * Gets the FirebaseService singleton instance
 * @returns {FirebaseService} The Firebase service instance for sending notifications
 */
const getFirebaseService = () => {
  return FirebaseService; // Using the singleton instance directly
};

/**
 * @module notifications
 */
module.exports = {
  // Notification classes
  BaseNotification,
  ModuleNotification,
  HighMeasurementNotification,
  FarmNotification,
  
  // Helper functions
  getFirebaseService,
};

/**
 * @example <caption>Sending a module notification</caption>
 * const { ModuleNotification, getFirebaseService } = require('./app/services/notifications');
 * 
 * // Create a notification instance
 * const notification = new ModuleNotification({
 *   moduleId: 123,
 *   title: 'Module Update',
 *   body: 'Your module has been updated successfully',
 *   recipient: 'DEVICE_TOKEN_HERE'
 * });
 * 
 * // Send the notification
 * const firebaseService = getFirebaseService();
 * firebaseService.sendNotification(notification)
 *   .then(() => console.log('Notification sent successfully'))
 *   .catch(error => console.error('Failed to send notification:', error));
 * 
 * @example <caption>Sending a high measurement notification</caption>
 * const { HighMeasurementNotification, getFirebaseService } = require('./app/services/notifications');
 * 
 * // Create a notification for high temperature
 * const notification = new HighMeasurementNotification({
 *   moduleId: 456,
 *   measurementType: 'temperature',
 *   value: 35.5,
 *   threshold: 30,
 *   recipient: 'DEVICE_TOKEN_HERE'
 * });
 * 
 * // Send the notification
 * getFirebaseService().sendNotification(notification)
 *   .then(response => console.log('Notification sent:', response))
 *   .catch(error => console.error('Error sending notification:', error));
 * 
 * @example <caption>Sending a farm notification</caption>
 * const { FarmNotification, getFirebaseService } = require('./app/services/notifications');
 * 
 * // Create a farm update notification using a factory method
 * const notification = FarmNotification.createUpdateNotification({
 *   farmId: 789,
 *   farmName: 'Green Valley Farm',
 *   recipient: 'DEVICE_TOKEN_HERE'
 * });
 * 
 * // Send the notification
 * getFirebaseService().sendNotification(notification)
 *   .then(() => console.log('Farm notification sent'))
 *   .catch(error => console.error('Error sending farm notification:', error));
 */

