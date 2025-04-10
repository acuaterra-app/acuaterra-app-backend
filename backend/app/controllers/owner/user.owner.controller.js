const ApiResponse = require('../../utils/apiResponse');

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

            const result = await this.userOwnerService.getMonitorUsers(page, limit, sortField, sortOrder);

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
}

module.exports = userOwnerController;