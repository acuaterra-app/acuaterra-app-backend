'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero eliminar la columna id_hardware de sensors
    await queryInterface.removeColumn('sensors', 'id_hardware');
    
    // Luego eliminar las tablas
    await queryInterface.dropTable('parameters');
    await queryInterface.dropTable('binnacles');
    await queryInterface.dropTable('hardware');
  },

  async down(queryInterface, Sequelize) {
    // Recrear las tablas en orden inverso
    await queryInterface.createTable('hardware', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      id_module: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'modules',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('parameters', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      id_sensor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sensors',
          key: 'id'
        }
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('binnacles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      id_module: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'modules',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Agregar la columna id_hardware de vuelta a sensors
    await queryInterface.addColumn('sensors', 'id_hardware', {
      type: Sequelize.INTEGER,
      references: {
        model: 'hardware',
        key: 'id'
      }
    });
  }
};
