'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('thresholds', 'min_value');
    await queryInterface.removeColumn('thresholds', 'max_value');

    await queryInterface.addColumn('thresholds', 'value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });

    await queryInterface.addColumn('thresholds', 'type', {
      type: Sequelize.ENUM('min', 'max'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('thresholds', 'value');
    await queryInterface.removeColumn('thresholds', 'type');

    await queryInterface.addColumn('thresholds', 'min_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('thresholds', 'max_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  }
};

