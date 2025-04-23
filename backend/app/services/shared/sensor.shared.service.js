const { Sensor, Threshold } = require('../../../models');

class SensorService {

    async createDefaultSensorsForModule(id_module) {
        const defaultSensorTypes = [
            { name: 'Sensor de Temperatura', type: 'temperature' },
            { name: 'Sensor de Proximidad', type: 'proximity' }
        ];

        const sensorsToCreate = defaultSensorTypes.map(sensorType => ({
            name: sensorType.name,
            type: sensorType.type,
            id_module: id_module
        }));

        return Sensor.bulkCreate(sensorsToCreate);
    }
}

module.exports = SensorService;