'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('farms', 'latitude', {
      type: Sequelize.STRING(256),
      allowNull: false
    });
    await queryInterface.changeColumn('farms', 'longitude', {
      type: Sequelize.STRING(256),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('farms', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
    await queryInterface.changeColumn('farms', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: false
    });

    await queryInterface.removeColumn('sensors', 'id_module');
  }
};

