const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FarmUser extends Model {
    static associate(models) {

    }
  }

  FarmUser.init({
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    id_farm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'farm',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'FarmUser',
    tableName: 'farm_user',
    timestamps: true
  });

  return FarmUser;
};