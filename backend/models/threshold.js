const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Threshold extends Model {
    static associate(models) {
      Threshold.belongsTo(models.Sensor, {
        foreignKey: 'id_sensor',
        as: 'sensor'
      });
    }
  }

  Threshold.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      id_sensor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sensor',
          key: 'id'
        }
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('min', 'max'),
        allowNull: false
      },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        }
    },
    {
      sequelize,
      modelName: 'Threshold',
      tableName: 'thresholds',
      timestamps: true
    }
  );

  return Threshold;
};

