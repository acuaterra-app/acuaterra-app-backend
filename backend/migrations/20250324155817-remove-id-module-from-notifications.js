'use strict';
/** @type {import('sequelize-cli').Migration} */ module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'id_module');
  },

  async down (queryInterface, Sequelize) {
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
