
const { Measurement, Sensor, Module, User } = require('../../../models');

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
            throw new Error('Error creating measurement');
        }
    }

    async getMeasurementsByOwnerModule(userId) {
        try {
            const module = await Module.findOne({
                where: {
                    created_by_user_id: userId
                }
            });

            if (!module) {
                return {
                    success: false,
                    message: 'No module found',
                    data: []
                };
            }

            const sensors = await Sensor.findAll({
                where: {
                    id_module: module.id
                }
            });

            if (sensors.length === 0) {
                return {
                    success: true,
                    message: 'No sensors found',
                    data: []
                };
            }

            const sensorIds = sensors.map(sensor => sensor.id);

            const measurements = await Measurement.findAll({
                where: {
                    id_sensor: sensorIds
                },
                order: [
                    ['date', 'DESC'],
                    ['time', 'DESC']
                ],
            });

            return {
                success: true,
                message: 'Measurements retrieved successfully',
                data: measurements
            };
        } catch (error) {
            console.error('Error in getMeasurementsByOwnerModule:', error);
            return {
                success: false,
                message: 'Error obtaining measurements',
                error: error.message
            };
        }
    }
}

module.exports = MeasurementService;
