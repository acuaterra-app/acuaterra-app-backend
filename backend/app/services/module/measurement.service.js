
const { Measurement, Sensor, Module, User } = require('../../../models');
const { Op } = require('sequelize');
const SensorAlertHandlerService = require('../notifications/sensor-alert-handler.service');

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

            if (payload.thresholdInfo && payload.thresholdInfo.isOutOfThreshold) {
                await SensorAlertHandlerService.handleSensorAlert({
                    sensorType: type,
                    value,
                    moduleId: id_module,
                    timestamp: new Date(`${date} ${time}`)
                },   {
                        isOutOfThreshold: payload.thresholdInfo.isOutOfThreshold,
                        min: payload.thresholdInfo.thresholds.min,
                        max: payload.thresholdInfo.thresholds.max
                    }
                );
            }

            return measurement;
        } catch (error) {
            throw new Error('Error creating measurement');
        }
    }

    async getMeasurementsByOwnerModule(userId, sensorId = null) {
        try {
            const userModules = await Module.findAll({
                where: {
                    [Op.or]: [
                        { created_by_user_id: userId },
                        { '$users.id$': userId }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'users',
                        through: { attributes: [] }
                    },
                    {
                        model: Sensor,
                        as: 'sensors',
                        required: sensorId ? true : false,
                        where: sensorId ? { id: sensorId } : {}
                    }
                ]
            });

            if (userModules.length === 0) {
                return {
                    success: false,
                    message: 'No module found for user',
                    data: []
                };
            }

            const sensorIds = userModules.flatMap(module =>
                module.sensors.map(sensor => sensor.id)
            );

            const measurements = await Measurement.findAll({
                where: {
                    id_sensor: sensorIds
                },
                order: [['date', 'DESC'], ['time', 'DESC']]
            });

            return {
                success: true,
                message: 'Measurements retrieved successfully',
                data: measurements
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error obtaining measurements',
                error: error.message
            };
        }
    }
}

module.exports = MeasurementService;
