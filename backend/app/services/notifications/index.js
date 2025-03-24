/**
 * @fileoverview Notifications module - exports all notification classes and utilities
 * This module provides a unified API for sending various types of FCM notifications
 */

const BaseNotification = require('./base-notification');
const FarmNotification = require('./farm-notification');
const FirebaseService = require('./firebase.service');

/**
 * Gets the FirebaseService singleton instance
 * @returns {FirebaseService} The Firebase service instance for sending notifications
 */
const getFirebaseService = () => {
  return getFirebaseService(); // Using the singleton instance directly
};

/**
 * @module notifications
 */
module.exports = {
  // Notification classes
  BaseNotification,
  FarmNotification,
  
  // Helper functions
  getFirebaseService,
};