const { Module, Farm, User} = require('../../../models');
const SensorService = require("../shared/sensor.shared.service");
const ThresholdService = require("../shared/threshold.shared.service");

class ModuleOwnerService {
    constructor() {
        this.sensorService = new SensorService();
        this.thresholdService = new ThresholdService();
    }

    async create(moduleData) {
        try {
            const {
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                created_by_user_id
            } = moduleData;

            const newModule = await Module.create({
                name,
                location,
                latitude,
                longitude,
                species_fish,
                fish_quantity,
                fish_age,
                dimensions,
                id_farm,
                created_by_user_id
            });

           /* const defaultSensors = await this.thresholdService.createDefaultThresholds(newModule.id);

            for(const sensor of defaultSensors){
                await this.thresholdService.createDefaultThresholds(sensor.id);
            }

            */
            return await Module.findByPk(newModule.id, {
                include: [
                    {
                        model: Farm,
                        as: 'farm',
                        attributes: ['id', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });
        } catch (error) {
            console.error("Error creating module:", error);
            throw error;
        }
    }
}

module.exports = ModuleOwnerService;