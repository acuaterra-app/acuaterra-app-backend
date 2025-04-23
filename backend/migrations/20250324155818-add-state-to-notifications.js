'use strict';

const {NOTIFICATION_STATE} = require("../app/enums/notification-state.enum");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add state column to notifications table
    await queryInterface.addColumn('notifications', 'state', {
      type: Sequelize.STRING(10),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove state column from notifications table
    await queryInterface.removeColumn('notifications', 'state');
  }
};

