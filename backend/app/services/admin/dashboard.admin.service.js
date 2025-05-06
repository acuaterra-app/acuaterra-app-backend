const { Farm, Module, User, Notification, sequelize } = require('../../../models');
const { Op } = require('sequelize');

class DashboardAdminService {
    async getGeneralMetrics() {
        try {
            const totalFarms = await Farm.count({
                where: { isActive: true }
            });

            const totalModules = await Module.count({
                where: { isActive: true }
            });

            const totalUsers = await User.count({
                where: {
                    isActive: true,
                    id_rol: {
                        [Op.in]: [1, 2, 3]
                    }
                }
            });

            return {
                totalFarms,
                totalModules,
                totalUsers
            };
        } catch (error) {
            console.error("Error getting general metrics:", error);
            throw error;
        }
    }

    async getFarmStats() {
        try {
            const stats = await Farm.findAll({
                attributes: [
                    'isActive',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                ],
                group: ['isActive']
            });

            return {
                active: stats.find(s => s.isActive)?.getDataValue('total') || 0,
                inactive: stats.find(s => !s.isActive)?.getDataValue('total') || 0
            };
        } catch (error) {
            console.error("Error getting farm stats:", error);
            throw error;
        }
    }

    async getModuleStats() {
        try {
            const stats = await Module.findAll({
                attributes: [
                    'isActive',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                ],
                group: ['isActive']
            });

            return {
                active: stats.find(s => s.isActive)?.getDataValue('total') || 0,
                inactive: stats.find(s => !s.isActive)?.getDataValue('total') || 0
            };
        } catch (error) {
            console.error("Error getting module stats:", error);
            throw error;
        }
    }

    async getNotificationStats(farmId, moduleIds, timeRange, groupBy = 'weekly') {
        try {
            const whereClause = {
                type: 'sensor_alert'
            };

            if (farmId) {
                const modules = await Module.findAll({
                    where: { 
                        id_farm: farmId,
                        isActive: true 
                    },
                    attributes: ['id']
                });
                
                const moduleIdsFromFarm = modules.map(module => module.id);
                
                if (moduleIdsFromFarm.length === 0) {
                    return [];
                }
                
                whereClause['data.moduleId'] = {
                    [Op.in]: moduleIdsFromFarm.map(id => id.toString())
                };
            } else if (moduleIds && moduleIds.length > 0) {
                whereClause['data.moduleId'] = {
                    [Op.in]: moduleIds.map(id => id.toString())
                };
            }

            if (timeRange && timeRange.startDate && timeRange.endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(timeRange.startDate), new Date(timeRange.endDate)]
                };
            }

            let timeFormat;
            if (groupBy === 'weekly') {
                timeFormat = sequelize.dialect.name === 'mysql' 
                    ? 'DATE_FORMAT(createdAt, "%Y-%u")' 
                    : "to_char(\"createdAt\", 'YYYY-IW')";
            } else { // monthly
                timeFormat = sequelize.dialect.name === 'mysql' 
                    ? 'DATE_FORMAT(createdAt, "%Y-%m")' 
                    : "to_char(\"createdAt\", 'YYYY-MM')";
            }

            const result = await Notification.findAll({
                attributes: [
                    [sequelize.literal(timeFormat), 'period'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total']
                ],
                where: whereClause,
                group: ['period'],
                order: [[sequelize.literal('period'), 'ASC']]
            });

            const labels = result.map(item => {
                const period = item.getDataValue('period');
                if (groupBy === 'weekly') {
                    const [year, week] = period.split('-');
                    return `Week ${week} of ${year}`;
                } else {
                    const [year, month] = period.split('-');
                    const monthNames = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                }
            });

            const values = result.map(item => item.getDataValue('total'));

            return {
                labels,
                datasets: [{
                    label: 'Alert Notification',
                    data: values
                }]
            };
        } catch (error) {
            console.error("Error getting notification stats:", error);
            throw error;
        }
    }
}

module.exports = DashboardAdminService;

