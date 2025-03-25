'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('module_user', 'id_person', 'id_user');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('module_user', 'id_user', 'id_person');
  }
};
