class BasedThreshold {
    static sensorThresholds = {
        'proximity': { min: 4.50, max: 12.50 },
        'temperature': { min: 8.50, max: 35.0 },
        /*
        'ph': { min: 6.0, max: 8.0 },
        'oxygen': { min: 5.0, max: 8.0 },
        'turbidity': { min: 0.0, max: 20.0 },
        'conductivity': { min: 100.0, max: 2000.0 },
        'salinity': { min: 0.0, max: 35.0 }
         */
    };

    static isSupportedSensor(sensorType) {
        return sensorType in this.sensorThresholds;
    }

    static getMinThreshold(sensorType) {
        if (!this.isSupportedSensor(sensorType)) {
            throw new Error(`Sensor type '${sensorType}' not supported`);
        }
        return this.sensorThresholds[sensorType].min;
    }

    static getMaxThreshold(sensorType) {
        if (!this.isSupportedSensor(sensorType)) {
            throw new Error(`Sensor type '${sensorType}' not supported`);
        }
        return this.sensorThresholds[sensorType].max;
    }

    static async getDefaultMinThreshold(sensorType) {
        return this.getMinThreshold(sensorType);
    }

    static async getDefaultMaxThreshold(sensorType) {
        return this.getMaxThreshold(sensorType);
    }
}

module.exports = BasedThreshold;