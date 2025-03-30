const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const { Sensor, Threshold } = require('../../models');
const BasedThreshold = require('../utils/based.threshold');

class ValidateSensorThresholdMiddleware {

  async validate(req, res, next) {
    try {
      const { type, value } = req.body;

      if (!type || value === undefined || value === null) {
        const response = ApiResponse.createApiResponse('Incomplete measurement data', [], [])
        return res.status(400).json(response);
      }

      const sensor = await Sensor.findOne({
        where: { type: type.toLowerCase() },
        include: [{
          model: Threshold,
          as: 'thresholds'
        }]
      });

      if (!sensor) {
        const response = ApiResponse.createApiResponse(`Sensor type '${type}' not found in the database`, [], [])
        return res.status(400).json(response);
      }

      let minThreshold, maxThreshold;
      let usingDbThresholds = false;

      if (sensor.thresholds && sensor.thresholds.length > 0) {
        const minThresholdObj = sensor.thresholds.find(t => t.type === 'min');
        const maxThresholdObj = sensor.thresholds.find(t => t.type === 'max');

        if (minThresholdObj && maxThresholdObj) {
          minThreshold = parseFloat(minThresholdObj.value);
          maxThreshold = parseFloat(maxThresholdObj.value);
          usingDbThresholds = true;
          logger.info(`Using database thresholds for ${type}: min=${minThreshold}, max=${maxThreshold}`);
        }
      }

      if (!usingDbThresholds) {
        if (!BasedThreshold.isSupportedSensor(type.toLowerCase())) {
          logger.error(`No thresholds are configured for sensor ${type} and it is not supported by BasedThreshold`);
          const response = ApiResponse.createApiResponse(`No thresholds are configured for the sensor ${type}`, [], [])
          return res.status(400).json(response);
        }

        minThreshold = BasedThreshold.getMinThreshold(type.toLowerCase());
        maxThreshold = BasedThreshold.getMaxThreshold(type.toLowerCase());
        logger.info(`Using default thresholds for ${type}: min=${minThreshold}, max=${maxThreshold}`);
      }

      const isWithinThreshold = value >= minThreshold && value <= maxThreshold;

      req.thresholdInfo = {
        isWithinThreshold,
        thresholds: {
          min: minThreshold,
          max: maxThreshold
        },
        isAlert: !isWithinThreshold
      };

      if (!isWithinThreshold) {
        logger.warn(`Out-of-threshold measurement detected: ${type} - ${value}`, {
          sensorType: type,
          value,
          threshold: {
            min: minThreshold,
            max: maxThreshold
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Error validating sensor thresholds', {
        error: error.message,
        stack: error.stack
      });
      const response = ApiResponse.createApiResponse('Internal error while validating sensor thresholds', [], [])
      return res.status(500).json(response);
    }
  }
}

module.exports = ValidateSensorThresholdMiddleware;