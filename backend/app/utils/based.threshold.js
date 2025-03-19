class BasedThreshold {

     getDefaultMinThreshold(sensorType) {
        switch(sensorType) {
            case 'proximity':
                return 4.50;
            case 'temperature':
                return 8.50;

        }
    }

     getDefaultMaxThreshold(sensorType) {
        switch(sensorType) {
            case 'proximity':
                return 12.50;
            case 'temperature':
                return 35.0;
        }
    }
}

module.exports = BasedThreshold;