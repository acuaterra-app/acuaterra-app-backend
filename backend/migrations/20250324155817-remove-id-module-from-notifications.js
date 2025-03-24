'use strict';
/** @type {import('sequelize-cli').Migration} */ module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove id_module column from notifications table
    await queryInterface.removeColumn('notifications', 'id_module');
  },

  async down (queryInterface, Sequelize) {
    // Add id_module column back if needed for rollback
    await queryInterface.addColumn('notifications', 'id_module', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'modules',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
