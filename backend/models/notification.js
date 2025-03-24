const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      // Removed association with Module
      
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
    // Foreign key to associate notifications with users
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for notifications not tied to specific users
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
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  });
  
  return Notification;
};