'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.bulkUpdate('roles', {
      name: 'module'
    }, {
      name: 'sensor'
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.bulkUpdate('roles', {
      name: 'sensor'
    }, {
      name: 'module'
    });
  }
};