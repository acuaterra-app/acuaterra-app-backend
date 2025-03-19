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

    await queryInterface.addColumn('sensors', 'id_module', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      }
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

