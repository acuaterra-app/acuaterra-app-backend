const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ModuleUser extends Model {
    static associate(models) {
      ModuleUser.belongsTo(models.User, {
        foreignKey: 'id_user'
      });
      ModuleUser.belongsTo(models.Module, {
        foreignKey: 'id_module'
      });
    }
  }

  ModuleUser.init({
    id_module: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
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
    modelName: 'ModuleUser',
    tableName: 'module_user',
    timestamps:true
  });
  return ModuleUser;
};
