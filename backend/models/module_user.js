const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ModuleUser extends Model {
    static associate(models) {
      //
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
    }
  }, {
    sequelize,
    modelName: 'ModuleUser',
    tableName: 'module_user',
    timestamps:true
  });

  return ModuleUser;
};
