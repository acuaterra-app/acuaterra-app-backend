const { Model, DataTypes } = require('sequelize');
const {NOTIFICATION_STATE} = require("../app/enums/notification-state.enum");
module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {

      Notification.belongsTo(models.User, {
        foreignKey: 'id_user',
        onDelete: 'CASCADE'
      });
    }
  }
  
  Notification.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    date_hour: {
      type: DataTypes.DATE,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(10),
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  });
  
  return Notification;
};