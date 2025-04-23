'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // IMPORTANT: Replace SENSOR_ID_1 and SENSOR_ID_2 with actual sensor IDs from your database
    await queryInterface.bulkInsert('thresholds', [
      {
        id_sensor: 1,
        value: 8.5,
        type: 'min',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_sensor: 1,
        value: 35.0,
        type: 'max',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_sensor: 2,
        value: 4.5,
        type: 'min',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_sensor: 2,
        value: 12.5,
        type: 'max',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {

  }
};
