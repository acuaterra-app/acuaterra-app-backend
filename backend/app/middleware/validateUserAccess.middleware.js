const ApiResponse = require("../utils/apiResponse");
const {  Farm, ModuleUser, FarmUser, Sensor } = require("../../models");
const { ROLES } = require("../enums/roles.enum");
const { Op } = require("sequelize");

class ValidateUserAccessMiddleware {
  constructor() {
    this.extendRoleValidation = this.extendRoleValidation.bind(this);
    this.handleRoleBasedAccess = this.handleRoleBasedAccess.bind(this);
    this.filterFarmsByMonitor = this.filterFarmsByMonitor.bind(this);
    this.filterModulesByMonitor = this.filterModulesByMonitor.bind(this);
    this.filterMeasurementsByMonitor = this.filterMeasurementsByMonitor.bind(this);
    this.restrictCrudForMonitor = this.restrictCrudForMonitor.bind(this);
    this.checkMonitorAccess = this.checkMonitorAccess.bind(this);
  }

  extendRoleValidation() {
    return async (req, res, next) => {
      try {
        if (req.method === 'GET') {
          if (req.user && req.user.id_rol === ROLES.MONITOR) {
            req.isMonitor = true;
            req.userId = req.user.id;
            return next();
          } else if (req.user && req.user.id_rol === ROLES.OWNER) {
            req.isMonitor = false;
            req.userId = req.user.id;
            return next();
          }
        } else if (req.method !== 'GET' && req.user && req.user.id_rol === ROLES.MONITOR) {
          return res.status(403).json(
            ApiResponse.createApiResponse('Access denied', [], [{
              'error': 'Monitors can only perform read operations'
            }])
          );
        }
        next();
      } catch (error) {
        console.error('Error in extendRoleValidation middleware:', error);
        return res.status(500).json(
          ApiResponse.createApiResponse('Server error', [], [{
            'error': error.message
          }])
        );
      }
    };
  }

  handleRoleBasedAccess() {
    return async (req, res, next) => {
      try {
        if (!req.isMonitor || !req.user) {
          return next();
        }
        const originalJson = res.json;
        const monitorId = req.user.id;

        const normalizedPath = req.originalUrl || req.path;

        let filterFunction = null;
        if (normalizedPath.includes('/measurement')) {
          filterFunction = (data) => this.filterMeasurementsByMonitor(data, monitorId);
        } else if (normalizedPath.includes('/modules') || normalizedPath.includes('/module/')) {
          filterFunction = (data) => this.filterModulesByMonitor(data, monitorId);
        } else if (normalizedPath.includes('/monitors')) {
          filterFunction = (data) => data;
        } else if (normalizedPath.startsWith('/farms')) {
          filterFunction = (data) => this.filterFarmsByMonitor(data, monitorId);
        }

        if (filterFunction) {
          const originalJsonBound = originalJson.bind(res);
          res.json = async function(data) {
            try {
              if (!data || typeof data !== 'object') {
                return originalJsonBound(data);
              }

              if (data.hasOwnProperty('data')) {
                const filteredData = await filterFunction(data.data);
                data.data = filteredData;
              }

              return originalJsonBound(data);
            } catch (error) {
              console.error("Error in response intercept:", error);
              console.error(error.stack);
              return originalJsonBound(data);
            }
          };
        }

        next();
      } catch (error) {
        console.error('Error in handleRoleBasedAccess middleware:', error);
        return res.status(500).json(
          ApiResponse.createApiResponse('Server error', [], [{
            'error': error.message
          }])
        );
      }
    };
  }

  async filterFarmsByMonitor(farms, id_user) {
    try {
      const monitorFarms = await FarmUser.findAll({
        where: {
          id_user: id_user,
          isActive: true
        },
        attributes: ['id_farm']
      });

      const allowedFarmIds = monitorFarms.map(mf => mf.id_farm);

      if (allowedFarmIds.length === 0) {
        return [];
      }

      if (Array.isArray(farms)) {
        const filteredFarms = farms.filter(farm => allowedFarmIds.includes(farm.id));

        const serializedFarms = filteredFarms.map(farm =>
          farm.toJSON ? farm.toJSON() : farm
        );

        return serializedFarms;
      } else if (farms && typeof farms === 'object') {

        const fetchedFarms = await Farm.findAll({
          where: {
            id: allowedFarmIds,
            isActive: true
          },
          order: [['id', 'DESC']]
        });

        const serializedFarms = fetchedFarms.map(farm => {
          const farmData = farm.toJSON ? farm.toJSON() : farm;

          return {
            ...farmData,
            latitude: farmData.latitude || "",
            longitude: farmData.longitude || ""
          };
        });

        return serializedFarms;
      }

      return [];
    } catch (error) {
      console.error('Error filtering farms by monitor:', error);
      console.error(error.stack);
      return [];
    }
  }

  async filterModulesByMonitor(modules, monitorId) {
    try {
      if (!Array.isArray(modules)) {
        return modules;
      }

      const monitorModules = await ModuleUser.findAll({
        where: {
          id_user: monitorId,
          isActive: true
        },
        attributes: ['id_module']
      });

      const allowedModuleIds = monitorModules.map(mm => mm.id_module);

      return modules.filter(module => allowedModuleIds.includes(module.id));
    } catch (error) {
      console.error('Error filtering modules by monitor:', error);
      return [];
    }
  }

  async filterMeasurementsByMonitor(measurements, monitorId) {
    try {
      if (!Array.isArray(measurements) || measurements.length === 0) {
        return measurements;
      }

      const monitorModules = await ModuleUser.findAll({
        where: { 
          id_user: monitorId,
          isActive: true 
        },
        attributes: ['id_module']
      });

      if (monitorModules.length === 0) {
        return [];
      }

      const allowedModuleIds = monitorModules.map(mm => mm.id_module);

      const allowedSensors = await Sensor.findAll({
        where: {
          id_module: { [Op.in]: allowedModuleIds },
          isActive: true
        },
        attributes: ['id']
      });

      if (allowedSensors.length === 0) {
        return [];
      }

      const allowedSensorIds = allowedSensors.map(sensor => Number(sensor.id));
      
      const dataSensorIds = [...new Set(measurements.map(m =>
        Number(m.id_sensor || (m.sensor ? m.sensor.id : null))
      ).filter(id => id !== null))];
      
      const allSensorsAllowed = dataSensorIds.every(id => allowedSensorIds.includes(id));
      
      if (allSensorsAllowed && dataSensorIds.length > 0) {
        return measurements;
      }

      const filteredMeasurements = measurements.filter(measurement => {
        const sensorId = Number(measurement.id_sensor || (measurement.sensor ? measurement.sensor.id : null));
        return sensorId && allowedSensorIds.includes(sensorId);
      });

      return filteredMeasurements;
    } catch (error) {
      console.error('Error filtering measurements:', error);
      return [];
    }
  }

  restrictCrudForMonitor() {
    return (req, res, next) => {
      try {
        if (!req.isMonitor || !req.user) {
          return next();
        }

        if (req.method !== 'GET') {
          return res.status(403).json(
            ApiResponse.createApiResponse('Access denied', [], [{
              'error': 'Monitors can only perform read operations'
            }])
          );
        }

        next();
      } catch (error) {
        console.error('Error in restrictCrudForMonitor middleware:', error);
        return res.status(500).json(
          ApiResponse.createApiResponse('Server error', [], [{
            'error': error.message
          }])
        );
      }
    };
  }

  checkMonitorAccess(resourceType) {
    return async (req, res, next) => {
      try {
        if (!req.isMonitor || !req.user) {
          return next();
        }

        const monitorId = req.user.id;
        let hasAccess = false;

        switch (resourceType) {
          case 'farm':
            const id_farm = req.params.id || req.body.id_farm;
            if (!id_farm) {
              return next();
            }

            hasAccess = await FarmUser.findOne({
              where: {
                id_user: monitorId,
                id_farm: id_farm,
                isActive: true
              }
            });
            break;

          case 'module':
            const moduleId = req.params.id || req.params.moduleId || req.body.module_id;
            if (!moduleId) {
              return next();
            }

            hasAccess = await ModuleUser.findOne({
              where: {
                id_user: monitorId,
                id_module: moduleId,
                isActive: true
              }
            });
            break;

          case 'measurements':
            const sensorId = req.params.id_sensor || req.query.sensorId || req.body.id_sensor;

            if (sensorId) {
              const sensor = await Sensor.findOne({
                where: {
                  id: sensorId,
                  isActive: true
                }
              });

              if (!sensor) {
                return next();
              }

              hasAccess = await ModuleUser.findOne({
                where: {
                  id_user: monitorId,
                  id_module: sensor.id_module,
                  isActive: true
                }
              });
            } else {
              hasAccess = true;
            }
            break;

          default:
            return next();
        }

        if (!hasAccess) {
          return res.status(403).json(
              ApiResponse.createApiResponse('Access denied', [], [{
                'error': `Monitor does not have access to this ${resourceType}`
              }])
          );
        }

        next();
      } catch (error) {
        console.error(`Error checking monitor access to ${resourceType}:`, error);
        return res.status(500).json(
          ApiResponse.createApiResponse('Server error', [], [{
            'error': error.message
          }])
        );
      }
    };
  }
}

module.exports = ValidateUserAccessMiddleware;
