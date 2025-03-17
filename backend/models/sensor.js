const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sensor extends Model {
    static associate(models) {
      Sensor.belongsTo(models.Module, {
        foreignKey: 'id_module',
        as: 'module'
      });

      Sensor.hasMany(models.Threshold, {
        foreignKey: 'id_sensor',
        as: 'thresholds'
      });

      Sensor.hasMany(models.Measurement, {
        foreignKey: 'id_sensor',
        as: 'measurements'
      });
    }
  }

  Sensor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    id_module: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Sensor',
    tableName: 'sensors',
    timestamps: true
  });

  return Sensor;
};

