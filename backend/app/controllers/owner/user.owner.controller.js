const ApiResponse = require('../../utils/apiResponse');
const { ROLES } = require('../../enums/roles.enum');
class userOwnerController {
    constructor(userOwnerService) {
        this.userOwnerService = userOwnerService;
    }

    async index(req, res) {
        try {
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
            const sortField = req.query.sortField || 'createdAt';
            const sortOrder = req.query.sortOrder || 'DESC';
            const ownerId = req.user.id;
            
            const ownerModuleIds = req.ownerModuleIds || [];

            const result = await this.userOwnerService.getMonitorUsers(ownerId, page, limit, sortField, sortOrder, ownerModuleIds);

            if (result.rows.length === 0) {
                const paginationMeta = {
                    pagination: {
                        total: 0,
                        totalPages: 0,
                        currentPage: parseInt(page) || 1,
                        perPage: parseInt(limit) || 10,
                        hasNext: false,
                        hasPrev: false
                    }
                };
                const response = ApiResponse.createApiResponse(
                    "There are no monitors available at partner farms.",
                    [],
                    [],
                    paginationMeta
                );
                return res.json(response);
            }

            const paginationMeta = {
                pagination:{
                    total: result.count,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    perPage: result.perPage,
                    hasNext: result.currentPage < result.totalPages,
                    hasPrev: result.currentPage > 1
                }
            }

            const response = ApiResponse.createApiResponse(
                "Monitor users successfully recovered",
                [result.rows],
                [],
                paginationMeta
            );

            return res.json(response);
        } catch (error) {
            console.error("Error getting monitor users:", error);
            const response = ApiResponse.createApiResponse(
                "Error retrieving monitor users",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async createMonitor(req, res) {
        try {
            const monitorData = req.body;
            const result = await this.userOwnerService.createMonitorUser(monitorData);

            const response = ApiResponse.createApiResponse(
                "Monitor user created successfully",
                [result],
                []
            );

            return res.status(201).json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Internal error creating monitor user",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async updateMonitor(req, res) {
        try {
            const { id } = req.params;
            const monitorData = req.body;

            const result = await this.userOwnerService.updateMonitorUser(id, monitorData);

            const response = ApiResponse.createApiResponse(
                "Monitor user updated successfully",
                [result],
                []
            );

            return res.json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Error updating monitor user",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async disableMonitor(req, res) {
        try {
            const monitorToDisable = req.monitorToDisable;
            const { id } = monitorToDisable;

            const result = await this.userOwnerService.disableMonitor(monitorToDisable);

            const response = ApiResponse.createApiResponse(
                `The monitor with ID ${id} has been successfully disabled.`,
                [result],
                []
            );

            return res.json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Error disabling monitor",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async reactivateMonitor(req, res) {
        try {
            const monitorToReactivate = req.monitorToReactivate;

            const result = await this.userOwnerService.reactivateMonitor(monitorToReactivate);

            const response = ApiResponse.createApiResponse(
                `The monitor with ID ${monitorToReactivate.id} has been successfully reactivated.`,
                [result],
                []
            );

            return res.json(response);
        } catch (error) {
            const response = ApiResponse.createApiResponse(
                "Error reactivating the monitor",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async getActiveMonitors(req, res) {
        try {
            const ownerFarmIds = req.user.id_rol === ROLES.OWNER ? req.ownerFarmIds : null;
            const result = await this.userOwnerService.getActiveMonitors(ownerFarmIds);
            
            if (result.length === 0) {
                const response = ApiResponse.createApiResponse(
                    "No active monitors available.",
                    [],
                    []
                );
                return res.json(response);
            }

            const response = ApiResponse.createApiResponse(
                "Active monitors successfully recovered",
                [result],
                []
            );

            return res.json(response);
        } catch (error) {
            console.error("Error getting active monitors:", error);
            const response = ApiResponse.createApiResponse(
                "Error getting active monitors",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = userOwnerController;