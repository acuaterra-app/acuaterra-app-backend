const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.Module, {
        foreignKey: 'id_module',
        as: 'module'
      });
    }
  }

  Report.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_module: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'module',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    finish_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true
  });

  return Report;
};

