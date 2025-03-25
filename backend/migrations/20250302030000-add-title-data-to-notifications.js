'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notifications', 'title', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
    
    await queryInterface.addColumn('notifications', 'data', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'title');
    await queryInterface.removeColumn('notifications', 'data');
  }
};

