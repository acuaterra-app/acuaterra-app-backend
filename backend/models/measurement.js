const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Measurement extends Model {
    static associate(models) {
      Measurement.belongsTo(models.Sensor, {
        foreignKey: 'id_sensor',
        as: 'sensor'
      });
    }
  }

  Measurement.init({
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Measurement',
    tableName: 'measurements',
    timestamps: true
  });

  return Measurement;
};

