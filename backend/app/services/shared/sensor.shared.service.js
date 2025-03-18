const { Sensor, Threshold } = require('../../../models');

class SensorService {

    async createDefaultSensorsForModule(id) {

        const defaultSensorTypes = await Threshold.findAll({
            attributes: ['id', 'type', 'value'],
            group: ['id', 'type', 'value']
        });

        const sensorsToCreate = defaultSensorTypes.map(sensorType => ({
            name: sensorType.name,
            type: sensorType.type,
            id: id
        }));

        return Sensor.bulkCreate(sensorsToCreate);
    }
}

module.exports = SensorService;