const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Farm extends Model {
    static associate(models) {
      Farm.belongsToMany(models.User, {
        through: 'farm_user',
        foreignKey: 'id_farm',
        otherKey: 'id_user',
        as: 'users'
      });
    }
  }

  Farm.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    latitude: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    longitude: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Farm',
    tableName: 'farms',
    timestamps: true,
    defaultScope: {
      where: { isActive: true }
    },
    scopes: {
      all: {}
    }
  });

  return Farm;
};

