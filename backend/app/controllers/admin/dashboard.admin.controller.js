const ApiResponse = require('../../utils/apiResponse');

class DashboardAdminController {
    constructor(dashboardAdminService) {
        this.dashboardAdminService = dashboardAdminService;
    }

    async getGeneralMetrics(req, res) {
        try {
            const metrics = await this.dashboardAdminService.getGeneralMetrics();

            const response = ApiResponse.createApiResponse(
                "Dashboard metrics successfully retrieved",
                metrics,
                []
            );

            return res.json(response);
        } catch (error) {
            console.error("Error retrieving dashboard metrics:", error);
            const response = ApiResponse.createApiResponse(
                "Error retrieving dashboard metrics",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async getFarmAndModuleStats(req, res) {
        try {
            const [farmStats, moduleStats] = await Promise.all([
                this.dashboardAdminService.getFarmStats(),
                this.dashboardAdminService.getModuleStats()
            ]);

            const response = ApiResponse.createApiResponse(
                "Statistics successfully retrieved",
                {
                    farms: {
                        labels: ['Active', 'Inactive'],
                        datasets: [{
                            data: [farmStats.active, farmStats.inactive]
                        }]
                    },
                    modules: {
                        labels: ['Active', 'Inactive'],
                        datasets: [{
                            data: [moduleStats.active, moduleStats.inactive]
                        }]
                    }
                },
                []
            );

            return res.json(response);
        } catch (error) {
            console.error("Error retrieving statistics:", error);
            const response = ApiResponse.createApiResponse(
                "Error retrieving statistics",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }

    async getNotificationStats(req, res) {
        try {
            const { farmId, moduleIds, startDate, endDate, groupBy = 'weekly' } = req.query;

            const stats = await this.dashboardAdminService.getNotificationStats(
                farmId,
                moduleIds ? moduleIds.split(',') : null,
                { startDate, endDate },
                groupBy
            );

            const response = ApiResponse.createApiResponse(
                "Notification statistics successfully retrieved",
                stats,
                []
            );

            return res.json(response);
        } catch (error) {
            console.error("Error retrieving notification statistics:", error);
            const response = ApiResponse.createApiResponse(
                "Error retrieving notification statistics",
                [],
                [{ msg: error.message }]
            );
            return res.status(500).json(response);
        }
    }
}

module.exports = DashboardAdminController;