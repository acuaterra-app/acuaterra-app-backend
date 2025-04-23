'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET name = 'monitor' WHERE name = 'user' AND id = 3;`
    );


  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET name = 'user' WHERE name = 'monitor' AND id = 3;`
    );
    

  }
};
