'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cambiar latitude y longitude a STRING
    await queryInterface.changeColumn('farms', 'latitude', {
      type: Sequelize.STRING(256),
      allowNull: false
    });
    await queryInterface.changeColumn('farms', 'longitude', {
      type: Sequelize.STRING(256),
      allowNull: false
    });

    // Añadir id_module a sensors
    await queryInterface.addColumn('sensors', 'id_module', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir los cambios
    await queryInterface.changeColumn('farms', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
    await queryInterface.changeColumn('farms', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: false
    });

    await queryInterface.removeColumn('sensors', 'id_module');
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
