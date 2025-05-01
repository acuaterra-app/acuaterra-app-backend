
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

    async getMeasurementsByOwnerModule(userId, moduleId = null, sensorId = null, limit = 100) {
        try {
            if (!moduleId || !sensorId) {
                return { 
                    success: true, 
                    message: 'No measurements available', 
                    data: [] 
                };
            }

            const module = await Module.findOne({
                where: {
                    id: moduleId,
                    isActive: true,
                    [Op.or]: [
                        { created_by_user_id: userId },
                        { '$users.id$': userId }
                    ]
                },
                include: [{
                    model: User,
                    as: 'users',
                    attributes: [],
                    required: false,
                    through: { attributes: [] },
                    where: { isActive: true }
                }]
            });

            if (!module) {
                return { 
                    success: true, 
                    message: 'Module not found or unauthorized', 
                    data: [] 
                };
            }
            const sensor = await Sensor.findOne({
                where: {
                    id: sensorId,
                    id_module: moduleId,
                    isActive: true
                }
            });

            if (!sensor) {
                return { 
                    success: true, 
                    message: 'Sensor not found', 
                    data: [] 
                };
            }

            const measurements = await Measurement.findAll({
                where: { 
                    id_sensor: sensorId
                },
                order: [['date', 'DESC'], ['time', 'DESC']],
                limit: limit,
                include: [{
                    model: Sensor,
                    as: 'sensor',
                    attributes: ['id', 'name', 'type', 'id_module']
                }]
            });
            
            return { 
                success: true, 
                message: 'Measurements retrieved', 
                data: measurements 
            };
        } catch (error) {
            return {
                success: false, 
                message: `${error.message}`, 
                data: [] 
            };
        }
    }
}

module.exports = MeasurementService;
