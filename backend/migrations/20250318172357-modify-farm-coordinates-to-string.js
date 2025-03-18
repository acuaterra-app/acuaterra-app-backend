'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'farms',
        'latitude',
        {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'farms',
        'longitude',
        {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'farms',
        'latitude',
        {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'farms',
        'longitude',
        {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        { transaction }
      );
    });
  }
};

