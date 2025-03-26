const db = require('../../../models');
const { Measurement, Sensor } = db;
const logger = require('../../utils/logger');

class MeasurementService {
    async createMeasurement(payload, id_module) {
        try {
            const {
                type,
                value,
                date,
                time
            } = payload;

            const sensor = await Sensor.findOne({
                where: {
                    type: type,
                    id_module: id_module
                }
            });

            if (!sensor) {
                throw new Error('Sensor not found');
            }

            const measurement = await Measurement.create({
                id_sensor: sensor.id,
                value,
                date,
                time
            });

            return measurement;
        } catch (error) {
            throw new Error('Error al crear medición');
        }
    }
}

module.exports = MeasurementService;