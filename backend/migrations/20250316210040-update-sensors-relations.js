'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la columna id_hardware
    await queryInterface.removeColumn('sensors', 'id_hardware');

    // Agregar la nueva columna id_module
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
    // Eliminar la columna id_module
    await queryInterface.removeColumn('sensors', 'id_module');

    // Restaurar la columna id_hardware
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

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
