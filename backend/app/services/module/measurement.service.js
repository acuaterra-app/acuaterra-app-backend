const db = require('../../../models');
const { Measurement, Sensor } = db;

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

    async getMeasurements(moduleId = null) {
        try {
            let query = {
                include: [{
                    model: Sensor,
                    as: 'sensor',
                    attributes: ['name', 'type', 'id_module']
                }],
                order: [
                    ['date', 'DESC'],
                    ['time', 'DESC']
                ]
            };
            
            if (moduleId) {
                query.include[0].where = { id_module: moduleId };
            }
            
            const measurements = await Measurement.findAll(query);
            return measurements;
        } catch (error) {
            console.error('Error getting measurements:', error);
            throw new Error('Error obtaining measurements');
        }
    }
}

module.exports = MeasurementService;
