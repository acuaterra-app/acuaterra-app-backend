const { Threshold, Sensor } = require('../../../models');
const { Op } = require('sequelize');

class ThresholdService {
  constructor() {
    this.model = Threshold;
  }

  async create(thresholdData) {
    try {
      const threshold = await this.model.create(thresholdData);
      return threshold;
    } catch (error) {
      console.error('Error creating threshold:', error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      console.error('Error finding thresholds:', error);
      throw error;
    }
  }

  async findOne(options) {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      console.error('Error finding threshold:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const [updatedCount] = await this.model.update(updateData, {
        where: { id }
      });
      return updatedCount > 0;
    } catch (error) {
      console.error('Error updating threshold:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedCount = await this.model.destroy({
        where: { id }
      });
      return deletedCount > 0;
    } catch (error) {
      console.error('Error deleting threshold:', error);
      throw error;
    }
  }

  async createDefaultThresholds(sensorId) {
    try {
      // Verify sensor exists
      const sensor = await Sensor.findByPk(sensorId);
      if (!sensor) {
        throw new Error(`Sensor with ID ${sensorId} not found`);
      }

      // Define default thresholds based on sensor type
      const defaultThresholds = [
        {
          id_sensor: sensorId,
          type: 'min',
          value: this.getDefaultMinThreshold(sensor.type)
        },
        {
          id_sensor: sensorId,
          type: 'max',
          value: this.getDefaultMaxThreshold(sensor.type)
        }
      ];

      // Bulk create thresholds
      return await this.model.bulkCreate(defaultThresholds);
    } catch (error) {
      console.error('Error creating default thresholds:', error);
      throw error;
    }
  }

  getDefaultMinThreshold(sensorType) {
    // Define default minimum thresholds based on sensor type
    switch(sensorType) {
      case 'temperature':
        return 18.0;
      case 'humidity':
        return 40.0;
      case 'ph':
        return 6.0;
      case 'oxygen':
        return 4.0;
      default:
        return 0.0;
    }
  }

  getDefaultMaxThreshold(sensorType) {
    // Define default maximum thresholds based on sensor type
    switch(sensorType) {
      case 'temperature':
        return 32.0;
      case 'humidity':
        return 80.0;
      case 'ph':
        return 8.0;
      case 'oxygen':
        return 10.0;
      default:
        return 100.0;
    }
  }
}

module.exports = ThresholdService;

