const { Threshold, Sensor } = require('../../../models');
const BasedThreshold = require("../../utils/based.threshold");

class ThresholdService {
    constructor() {
        this.model = new Threshold;
        this.based = new BasedThreshold();
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

    async createDefaultThresholds(id) {
        try {
            const sensor = await Sensor.findOne({
                where: {
                    id: id,
                    isActive: true
                }
            });
            
            if (!sensor) {
                throw new Error(`Active sensor with ID ${id} not found`);
            }

            const defaultThresholds = [
                {
                    id_sensor: id,
                    type: 'min',
                    value: this.based.getDefaultMinThreshold(sensor.type)
                },
                {
                    id_sensor: id,
                    type: 'max',
                    value: this.based.getDefaultMaxThreshold(sensor.type)
                }
            ];

            return await Threshold.bulkCreate(defaultThresholds);
        } catch (error) {
            console.error('Error creating default thresholds:', error);
            throw error;
        }
    }
}

module.exports = ThresholdService;

