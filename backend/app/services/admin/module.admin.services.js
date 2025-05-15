const { Module, Sensor, Measurement } = require('../../../models');
const { Op } = require('sequelize');

class ModuleAdminService {
    async getModulesByFarmId(farmId, limit = 10) {
        try {
            const modules = await Module.findAll({
                where: {
                    id_farm: farmId,
                    isActive: true
                },
                attributes: ['id', 'name', 'location'],
                include: [
                    {
                        model: Sensor,
                        as: 'sensors',
                        where: {
                            isActive: true
                        },
                        attributes: ['id', 'name', 'type'],
                        include: [
                            {
                                model: Measurement,
                                as: 'measurements',
                                where: {
                                    isActive: true
                                },
                                attributes: ['id', 'value', 'date', 'time'],
                                order: [['date', 'DESC'], ['time', 'DESC']],
                                limit: limit
                            }
                        ]
                    }
                ]
            });

            return {
                success: true,
                message: modules.length ? 'Modules retrieved successfully' : 'No modules found for this farm',
                data: modules
            };
        } catch (error) {
            console.error(`Error retrieving modules for farm ${farmId}:`, error);
            return {
                success: false,
                message: `Error retrieving modules: ${error.message}`,
                data: []
            };
        }
    }



async getMeasurementsByModuleId(moduleId, params) {
        try {
            const {
                startDate,
                endDate,
                period = 'daily', // 'daily', 'weekly', 'monthly'
                sensorType,
                limit = 100
            } = params;

            const whereClause = {
                isActive: true
            };

            if (startDate && endDate) {
                whereClause.date = {
                    [Op.between]: [startDate, endDate]
                };
            }

            const sensorWhereClause = {
                isActive: true,
                id_module: moduleId
            };

            if (sensorType) {
                sensorWhereClause.type = sensorType;
            }

            const measurements = await Measurement.findAll({
                where: whereClause,
                include: [{
                    model: Sensor,
                    as: 'sensor',
                    where: sensorWhereClause,
                    attributes: ['id', 'name', 'type']
                }],
                order: [['date', 'ASC'], ['time', 'ASC']],
                limit: limit
            });

            if (!measurements || measurements.length === 0) {
                return {
                    success: true,
                    message: 'No measurements found for the given parameters',
                    data: []
                };
            }

            const groupedData = this._groupMeasurementsByPeriod(measurements, period);
            
            const stats = this._calculateStatistics(measurements);
            
            const formattedData = this._formatDataForCharts(groupedData, period);

            return {
                success: true,
                message: 'Measurements retrieved successfully',
                data: [{
                    rawData: measurements,
                    chartData: formattedData,
                    stats: stats
                }]
            };
        } catch (error) {
            console.error(`Error retrieving measurements for module ${moduleId}:`, error);
            return {
                success: false,
                message: `Error retrieving measurements: ${error.message}`,
                data: []
            };
        }
    }

    _groupMeasurementsByPeriod(measurements, period) {
        const groupedData = {};

        for (const measurement of measurements) {
            let key;
            const date = new Date(measurement.date);
            
            switch (period) {
                case 'daily':
                    key = measurement.date;
                    break;
                case 'weekly':
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(date.setDate(diff));
                    key = monday.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
                default:
                    key = measurement.date;
            }

            const sensorId = measurement.sensor.id;
            const sensorName = measurement.sensor.name;
            const sensorType = measurement.sensor.type;
            
            if (!groupedData[sensorId]) {
                groupedData[sensorId] = {
                    sensorId,
                    sensorName,
                    sensorType,
                    periods: {}
                };
            }
            
            if (!groupedData[sensorId].periods[key]) {
                groupedData[sensorId].periods[key] = {
                    values: [],
                    sum: 0,
                    count: 0,
                    min: Infinity,
                    max: -Infinity
                };
            }
            
            const value = parseFloat(measurement.value);
            groupedData[sensorId].periods[key].values.push(value);
            groupedData[sensorId].periods[key].sum += value;
            groupedData[sensorId].periods[key].count += 1;
            groupedData[sensorId].periods[key].min = Math.min(groupedData[sensorId].periods[key].min, value);
            groupedData[sensorId].periods[key].max = Math.max(groupedData[sensorId].periods[key].max, value);
        }

        return groupedData;
    }

    _calculateStatistics(measurements) {
        if (!measurements || measurements.length === 0) {
            return {
                count: 0,
                minValue: null,
                maxValue: null,
                avgValue: null
            };
        }

        let minValue = Infinity;
        let maxValue = -Infinity;
        let sum = 0;

        for (const measurement of measurements) {
            const value = parseFloat(measurement.value);
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
            sum += value;
        }

        return {
            count: measurements.length,
            minValue,
            maxValue,
            avgValue: sum / measurements.length
        };
    }

    _formatDataForCharts(groupedData, period) {
        const result = {
            labels: [],
            datasets: []
        };

        const allPeriods = new Set();
        
        Object.values(groupedData).forEach(sensorData => {
            Object.keys(sensorData.periods).forEach(periodKey => {
                allPeriods.add(periodKey);
            });
        });
        
        result.labels = Array.from(allPeriods).sort();
        
        Object.values(groupedData).forEach(sensorData => {
            const dataset = {
                label: `${sensorData.sensorName} (${sensorData.sensorType})`,
                data: result.labels.map(label => {
                    const periodData = sensorData.periods[label];
                    if (periodData) {
                        return periodData.sum / periodData.count; // Valor promedio
                    }
                    return null;
                }),
                minValues: result.labels.map(label => {
                    const periodData = sensorData.periods[label];
                    return periodData ? periodData.min : null;
                }),
                maxValues: result.labels.map(label => {
                    const periodData = sensorData.periods[label];
                    return periodData ? periodData.max : null;
                })
            };
            
            result.datasets.push(dataset);
        });
        
        switch (period) {
            case 'daily':
                break;
            case 'weekly':
                result.labels = result.labels.map(label => `Semana del ${label}`);
                break;
            case 'monthly':
                result.labels = result.labels.map(label => {
                    const [year, month] = label.split('-');
                    const monthNames = [
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                });
                break;
        }
        
        return result;
    }
}

module.exports = ModuleAdminService;

