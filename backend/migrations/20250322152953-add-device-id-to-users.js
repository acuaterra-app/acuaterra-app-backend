'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'device_id', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'password'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'device_id');
  }
};

