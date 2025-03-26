
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

    async getMeasurements(loggedUserId) {
        try {
            if (!loggedUserId) {
                throw new Error('User ID is required');
            }

            const user = await User.findByPk(loggedUserId);
            if (!user) {
                throw new Error('User not found');
            }

            const userSensors = await Sensor.findAll({
                include: [{
                    model: Module,
                    as: 'module',
                    where: {
                        created_by_user_id: loggedUserId
                    },
                    required: true
                }]
            });

            if (userSensors.length === 0) {
                return [];
            }

            const sensorIds = userSensors.map(sensor => sensor.id);

            const measurements = await Measurement.findAll({
                where: {
                    id_sensor: sensorIds
                },
                attributes: [
                    'id', 'id_sensor','value',
                    'date', 'time', 'createdAt',
                    'updatedAt'
                ],
                order: [
                    ['date', 'DESC'],
                    ['time', 'DESC']
                ]
            });

            return measurements;
        } catch (error) {
            console.error('Detailed error in getMeasurements:', error);
            throw new Error(error.message || 'Error obtaining measurements');
        }
    }
}

module.exports = MeasurementService;
