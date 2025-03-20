'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sensors', 'id_hardware');

    await queryInterface.addColumn('sensors', 'id_module', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sensors', 'id_module');

    await queryInterface.addColumn('sensors', 'id_hardware', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'hardware',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
};

