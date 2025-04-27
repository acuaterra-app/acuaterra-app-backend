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

        const path = req.path;

        let filterFunction = null;
        if (path.startsWith('/farms') || path === '/') {
          filterFunction = (data) => this.filterFarmsByMonitor(data, monitorId);
        } else if (path.includes('/modules') || path.includes('/module/')) {
          filterFunction = (data) => this.filterModulesByMonitor(data, monitorId);
        } else if (path.includes('/monitors')) {
          filterFunction = (data) => data;
        } else if (path.includes('/measurement')) {
          console.log("Applying measurement filter for path:", path);
          filterFunction = (data) => this.filterMeasurementsByMonitor(data, monitorId);
        }

        if (filterFunction) {
          res.json = async function(data) {
            res.json = originalJson;

            try {
              if (data && typeof data === 'object') {
                console.log(`Processing response data for path: ${req.path}`);

                if (
                  data.hasOwnProperty('data') &&
                  typeof data.data === 'object' &&
                  !Array.isArray(data.data) &&
                  Object.keys(data.data).length === 0 &&
                  data.meta?.pagination?.total > 0
                ) {
                  if (req.path.startsWith('/farms') || req.path === '/') {

                    const monitorFarms = await FarmUser.findAll({
                      where: { id_user: monitorId },
                      attributes: ['id_farm']
                    });

                    if (monitorFarms && monitorFarms.length > 0) {
                      const allowedFarmIds = monitorFarms.map(mf => mf.id_farm);

                      const farms = await Farm.findAll({
                        where: {
                          id: allowedFarmIds,
                          isActive: true
                        }
                      });

                      data.data = farms.map(farm => farm.toJSON ? farm.toJSON() : farm);
                    }
                  } else {
                    const filteredData = await filterFunction(data.data);
                    if (Array.isArray(filteredData) && filteredData.length > 0) {
                      data.data = filteredData;
                    }
                  }
                } else if (data.hasOwnProperty('data')) {
                  console.log(`Filtering data, type: ${Array.isArray(data.data) ? 'array' : typeof data.data}, length: ${Array.isArray(data.data) ? data.data.length : 'N/A'}`);

                  const filteredData = await filterFunction(data.data);

                  if (Array.isArray(filteredData)) {
                    console.log(`Filtered data from ${data.data.length} to ${filteredData.length} items`);
                    data.data = filteredData;
                  } else if (filteredData && typeof filteredData === 'object') {
                    data.data = filteredData;
                  }
                }
              }
            } catch (error) {
              console.error("Error in response intercept:", error);
              console.error(error.stack);
            }
            return originalJson.call(this, data);
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
      // Si no hay mediciones o no es un array, retornar tal cual
      if (!Array.isArray(measurements) || measurements.length === 0) {
        return measurements;
      }

      console.log(`Processing ${measurements.length} measurements for monitor ${monitorId}`);

      // Obtener todos los módulos a los que el monitor tiene acceso
      const accessibleModules = await ModuleUser.findAll({
        where: { 
          id_user: monitorId,  // Cambiar monitor_id por id_user
          isActive: true 
        },
        attributes: ['module_id']
      });

      // Si no hay módulos accesibles, retornar las mediciones sin filtrar
      if (!accessibleModules || accessibleModules.length === 0) {
        console.log('No accessible modules found, returning all measurements');
        return measurements;
      }

      const moduleIds = accessibleModules.map(m => m.module_id);
      console.log(`Monitor has access to modules: ${moduleIds.join(', ')}`);

      // Obtener los sensores de los módulos accesibles
      const accessibleSensors = await Sensor.findAll({
        where: {
          id_module: { [Op.in]: moduleIds },
          isActive: true
        },
        attributes: ['id']
      });

      // Si no hay sensores, retornar las mediciones sin filtrar
      if (!accessibleSensors || accessibleSensors.length === 0) {
        console.log('No accessible sensors found, returning all measurements');
        return measurements;
      }

      const sensorIds = new Set(accessibleSensors.map(s => s.id));
      console.log(`Monitor has access to ${sensorIds.size} sensors`);

      // Filtrar las mediciones por los sensores accesibles
      const filteredMeasurements = measurements.filter(measurement => 
        sensorIds.has(measurement.id_sensor)
      );

      console.log(`Filtered measurements: ${filteredMeasurements.length} of ${measurements.length}`);

      // Si el filtrado es demasiado restrictivo, retornar todas las mediciones
      if (filteredMeasurements.length === 0 || 
          filteredMeasurements.length < measurements.length * 0.1) {
        console.log('Filtering too restrictive, returning all measurements');
        return measurements;
      }

      return filteredMeasurements;
    } catch (error) {
      console.error('Error in filterMeasurementsByMonitor:', error);
      // En caso de error, retornar las mediciones sin filtrar
      return measurements;
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
            
            // If a specific sensor ID is provided, check access to that sensor
            if (sensorId) {
              // Find the sensor to get its module
              const sensor = await Sensor.findOne({
                where: {
                  id: sensorId,
                  isActive: true
                }
              });
              
              if (!sensor) {
                return next();
              }
              
              // Check if monitor has access to the module that owns this sensor
              hasAccess = await ModuleUser.findOne({
                where: {
                  id_user: monitorId,
                  id_module: sensor.id_module,
                  isActive: true
                }
              });
            } else {
              // If no specific sensor, allow access (will be filtered later by filterMeasurementsByMonitor)
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
