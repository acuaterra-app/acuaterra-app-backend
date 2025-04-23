'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blacklist extends Model {

    static associate(models) {
      //
    }
  }
  Blacklist.init({
    token: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Blacklist',
    tableName: 'blacklist',
    timestamps: true
  });
  return Blacklist;
};