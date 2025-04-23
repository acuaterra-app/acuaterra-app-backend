const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Module extends Model {
    static associate(models) {
      Module.belongsTo(models.User, {
        foreignKey: 'created_by_user_id',
        as: 'creator'
      });

      Module.belongsTo(models.Farm, {
        foreignKey: 'id_farm',
        as: 'farm'
      });

      Module.hasMany(models.Sensor, {
        foreignKey: 'id_module',
        as: 'sensors'
      });
      
      Module.hasMany(models.Report, {
        foreignKey: 'id_module',
        as: 'reports'
      });

      Module.belongsToMany(models.User, {
        through: models.ModuleUser,
        foreignKey: 'id_module',
        otherKey: 'id_user',
        as: 'users'
      });
    }
  }
  
  Module.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.TEXT
    },
    latitude: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    longitude: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    species_fish: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fish_quantity: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fish_age: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    id_farm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'farms',
        key: 'id'
      }
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Module',
    tableName: 'modules',
    timestamps: true,
    defaultScope: {
      where: { isActive: true }
    },
    scopes: {
      all: {}
    }
  });
  
  return Module;
};

