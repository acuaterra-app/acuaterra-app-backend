const { Threshold, Sensor } = require('../../../models');

class ThresholdService {
    constructor() {
        this.model = new Threshold;
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
            // Verify sensor exists
            const sensor = await Sensor.findByPk(id);
            if (!sensor) {
                throw new Error(`Sensor with ID ${id} not found`);
            }

            // Define default thresholds based on sensor type
            const defaultThresholds = [
                {
                    id_sensor: id,
                    type: 'min',
                    value: this.getDefaultMinThreshold(sensor.type)
                },
                {
                    id_sensor: id,
                    type: 'max',
                    value: this.getDefaultMaxThreshold(sensor.type)
                }
            ];

            // Bulk create thresholds
            return await Threshold.bulkCreate(defaultThresholds);
        } catch (error) {
            console.error('Error creating default thresholds:', error);
            throw error;
        }
    }

    getDefaultMinThreshold(sensorType) {
        // Define default minimum thresholds based on sensor type
        switch(sensorType) {
            case 'proximity':
                return 4.50;
            case 'temperature':
                return 8.50;

        }
    }

    getDefaultMaxThreshold(sensorType) {
        // Define default maximum thresholds based on sensor type
        switch(sensorType) {
            case 'proximity':
                return 12.50;
            case 'temperature':
                return 35.0;
        }
    }
}

module.exports = ThresholdService;

