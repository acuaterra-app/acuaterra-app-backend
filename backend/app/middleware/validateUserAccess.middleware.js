// middlewares/validateUserAccess.middleware.js
const ApiResponse = require("../utils/apiResponse");
const { User, Farm, Module, ModuleUser, FarmUser } = require("../../models");
const { ROLES } = require("../enums/roles.enum");

class ValidateUserAccessMiddleware {
  constructor() {
    // Bind methods to ensure 'this' context is preserved
    this.extendRoleValidation = this.extendRoleValidation.bind(this);
    this.handleRoleBasedAccess = this.handleRoleBasedAccess.bind(this);
    this.filterFarmsByMonitor = this.filterFarmsByMonitor.bind(this);
    this.filterModulesByMonitor = this.filterModulesByMonitor.bind(this);
    this.restrictCrudForMonitor = this.restrictCrudForMonitor.bind(this);
    this.checkMonitorAccess = this.checkMonitorAccess.bind(this);
  }

  /**
   * Extends the ValidateRoleMiddleware to accept both OWNER and MONITOR roles for GET requests
   * Works as a middleware factory - returns a middleware function
   * @returns {Function} Express middleware function
   */
  extendRoleValidation() {
    return async (req, res, next) => {
      try {
        // GET requests can be accessed by both OWNER and MONITOR
        if (req.method === 'GET') {
          // Original role middleware already validated and set req.user
          // We just need to set additional flags for role-based behavior
          if (req.user && req.user.id_rol === ROLES.MONITOR) {
            req.isMonitor = true;
            req.userId = req.user.id;
            // Continue to next middleware which will handle filtering
            return next();
          } else if (req.user && req.user.id_rol === ROLES.OWNER) {
            req.isMonitor = false;
            req.userId = req.user.id;
            // Owners get full access without additional filtering
            return next();
          }
        } else if (req.method !== 'GET' && req.user && req.user.id_rol === ROLES.MONITOR) {
          // For non-GET requests, if user is a MONITOR, block access
          return res.status(403).json(
            ApiResponse.createApiResponse('Access denied', [], [{
              'error': 'Monitors can only perform read operations'
            }])
          );
        }

        // For all other cases, proceed normally
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

  /**
   * Main middleware that handles role-based access control
   * Must be applied after validateToken and validateRole middlewares
   * @returns {Function} Express middleware function
   */
  handleRoleBasedAccess() {
    return async (req, res, next) => {
      try {
        // Skip if not a monitor or if user data is missing
        if (!req.isMonitor || !req.user) {
          return next();
        }

        // Store original response.json to intercept the response
        const originalJson = res.json;
        const monitorId = req.user.id;

        // Check the route path to determine what kind of resource is being accessed
        const path = req.path;

        // Determine what filter should be applied based on the path
        let filterFunction = null;
        if (path.startsWith('/farms') || path === '/') {
          filterFunction = (data) => this.filterFarmsByMonitor(data, monitorId);
        } else if (path.includes('/modules') || path.includes('/module/')) {
          filterFunction = (data) => this.filterModulesByMonitor(data, monitorId);
        } else if (path.includes('/monitors')) {
          // For monitor routes, leave data as is - monitors can view other monitors
          filterFunction = (data) => data;
        }

        // Override response.json to intercept and filter the data
        if (filterFunction) {
          res.json = function(data) {
            // Reset the json method to avoid infinite recursion
            res.json = originalJson;

            // If data has the API response structure, filter its content
            if (data && data.data) {
              data.data = filterFunction(data.data);
            }

            // Call the original json method with the filtered data
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

  /**
   * Filter farms to only include those associated with the monitor
   * @param {Array} farms - Array of farms from the controller response
   * @param {Number} id_user - ID of the monitor
   * @returns {Array} Filtered array of farms
   */
  async filterFarmsByMonitor(farms, id_user) {
    try {
      if (!Array.isArray(farms)) {
        return farms; // Return as is if not an array
      }

      // Get all farm IDs associated with this monitor
      const monitorFarms = await FarmUser.findAll({
        where: { id_user: id_user },
        attributes: ['id_farm']
      });

      const allowedFarmIds = monitorFarms.map(mf => mf.id_farm);

      // Filter the farms array to only include farms associated with the monitor
      return farms.filter(farm => allowedFarmIds.includes(farm.id));
    } catch (error) {
      console.error('Error filtering farms by monitor:', error);
      return []; // Return empty array in case of error
    }
  }

  /**
   * Filter modules to only include those associated with the monitor
   * @param {Array} modules - Array of modules from the controller response
   * @param {Number} monitorId - ID of the monitor
   * @returns {Array} Filtered array of modules
   */
  async filterModulesByMonitor(modules, monitorId) {
    try {
      if (!Array.isArray(modules)) {
        return modules; // Return as is if not an array
      }

      // Get all module IDs associated with this monitor
      const monitorModules = await FarmUser.findAll({
        where: { monitor_id: monitorId },
        attributes: ['module_id']
      });

      const allowedModuleIds = monitorModules.map(mm => mm.module_id);

      // Filter the modules array to only include modules associated with the monitor
      return modules.filter(module => allowedModuleIds.includes(module.id));
    } catch (error) {
      console.error('Error filtering modules by monitor:', error);
      return []; // Return empty array in case of error
    }
  }

  /**
   * Restricts CRUD operations for monitors, allowing only GET requests
   * @returns {Function} Express middleware function
   */
  restrictCrudForMonitor() {
    return (req, res, next) => {
      try {
        // Skip validation if not a monitor or if user data is missing
        if (!req.isMonitor || !req.user) {
          return next();
        }

        // Allow only GET requests for monitors
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

  /**
   * Checks if a monitor has access to a specific resource (farm, module, etc.)
   * @param {String} resourceType - Type of resource to check ('farm', 'module', etc.)
   * @returns {Function} Express middleware function
   */
  checkMonitorAccess(resourceType) {
    return async (req, res, next) => {
      try {
        // Skip validation if not a monitor or if user data is missing
        if (!req.isMonitor || !req.user) {
          return next();
        }

        const monitorId = req.user.id;
        let hasAccess = false;

        switch(resourceType) {
          case 'farm':
            const id_farm = req.params.id || req.body.id_farm;
            if (!id_farm) {
              return next(); // No farm ID to check, proceed
            }

            hasAccess = await FarmUser.findOne({
              where: {
                monitor_id: monitorId,
                id_farm: id_farm
              }
            });
            break;

          case 'module':
            const moduleId = req.params.id || req.params.moduleId || req.body.module_id;
            if (!moduleId) {
              return next(); // No module ID to check, proceed
            }

            hasAccess = await ModuleUser.findOne({
              where: {
                monitor_id: monitorId,
                module_id: moduleId
              }
            });
            break;

          default:
            // Unknown resource type, allow access
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

