const BaseNotification = require('./base-notification');

/**
 * @typedef {Object} FarmEventTypes
 * @property {string} CREATED - Event when a farm is created
 * @property {string} UPDATED - Event when a farm is updated
 * @property {string} DELETED - Event when a farm is deleted
 * @property {string} STATUS_CHANGED - Event when a farm's status changes
 */

/**
 * Farm notification event types
 * @type {FarmEventTypes}
 */
const FARM_EVENT_TYPES = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  STATUS_CHANGED: 'STATUS_CHANGED'
};

/**
 * Class for handling farm-related notifications
 * @extends BaseNotification
 */
class FarmNotification extends BaseNotification {
  /**
   * Create a new farm notification
   * @param {string} farmId - The ID of the farm
   * @param {string} farmName - The name of the farm
   * @param {string} eventType - The type of event (from FARM_EVENT_TYPES)
   * @param {Object} [options={}] - Additional options
   */
  constructor(farmId, farmName, eventType, options = {}) {
    super();
    
    if (!Object.values(FARM_EVENT_TYPES).includes(eventType)) {
      throw new Error(`Invalid farm event type: ${eventType}`);
    }
    
    this.farmId = farmId;
    this.farmName = farmName;
    this.eventType = eventType;
    this.options = options;
  }

  /**
   * Get the notification title based on the event type
   * @returns {string} The notification title
   */
  getTitle() {
    switch (this.eventType) {
      case FARM_EVENT_TYPES.CREATED:
        return `New Farm Created: ${this.farmName}`;
      case FARM_EVENT_TYPES.UPDATED:
        return `Farm Updated: ${this.farmName}`;
      case FARM_EVENT_TYPES.DELETED:
        return `Farm Deleted: ${this.farmName}`;
      case FARM_EVENT_TYPES.STATUS_CHANGED:
        return `Farm Status Changed: ${this.farmName}`;
      default:
        return `Farm Notification: ${this.farmName}`;
    }
  }

  /**
   * Get the notification body based on the event type
   * @returns {string} The notification body
   */
  getBody() {
    switch (this.eventType) {
      case FARM_EVENT_TYPES.CREATED:
        return `A new farm "${this.farmName}" has been created.`;
      case FARM_EVENT_TYPES.UPDATED:
        return `The farm "${this.farmName}" has been updated.`;
      case FARM_EVENT_TYPES.DELETED:
        return `The farm "${this.farmName}" has been deleted.`;
      case FARM_EVENT_TYPES.STATUS_CHANGED:
        const { newStatus } = this.options;
        return `The farm "${this.farmName}" status has changed to "${newStatus || 'a new status'}".`;
      default:
        return `There is an update regarding farm "${this.farmName}".`;
    }
  }

  /**
   * Get data specific to farm notifications
   * @returns {Object} Notification data
   */
  getData() {
    return {
      notification_type: 'farm_notification',
      payload: this.farmId,
      url: `https://backend.acuaterra.tech/api/v2/shared/farms/${this.farmId}`,
      event_type: this.eventType,
      ...this.options
    };
  }

  /**
   * Factory method to create a notification for a newly created farm
   * @param {string} farmId - The ID of the farm
   * @param {string} farmName - The name of the farm
   * @param {Object} [options={}] - Additional options
   * @returns {FarmNotification} A new FarmNotification instance
   */
  static forCreated(farmId, farmName, options = {}) {
    return new FarmNotification(farmId, farmName, FARM_EVENT_TYPES.CREATED, options);
  }

  /**
   * Factory method to create a notification for an updated farm
   * @param {string} farmId - The ID of the farm
   * @param {string} farmName - The name of the farm
   * @param {Object} [options={}] - Additional options
   * @returns {FarmNotification} A new FarmNotification instance
   */
  static forUpdated(farmId, farmName, options = {}) {
    return new FarmNotification(farmId, farmName, FARM_EVENT_TYPES.UPDATED, options);
  }

  /**
   * Factory method to create a notification for a deleted farm
   * @param {string} farmId - The ID of the farm
   * @param {string} farmName - The name of the farm
   * @param {Object} [options={}] - Additional options
   * @returns {FarmNotification} A new FarmNotification instance
   */
  static forDeleted(farmId, farmName, options = {}) {
    return new FarmNotification(farmId, farmName, FARM_EVENT_TYPES.DELETED, options);
  }

  /**
   * Factory method to create a notification for a farm status change
   * @param {string} farmId - The ID of the farm
   * @param {string} farmName - The name of the farm
   * @param {string} newStatus - The new status of the farm
   * @param {Object} [options={}] - Additional options
   * @returns {FarmNotification} A new FarmNotification instance
   */
  static forStatusChanged(farmId, farmName, newStatus, options = {}) {
    return new FarmNotification(
      farmId, 
      farmName, 
      FARM_EVENT_TYPES.STATUS_CHANGED, 
      { newStatus, ...options }
    );
  }
}

// Export the class and event types
module.exports = {
  FarmNotification,
  FARM_EVENT_TYPES
};

