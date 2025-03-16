'use strict';

const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    
    const users = [
      {
        name: faker.person.fullName(),
        email: 'admin@example.com',
        password: await bcrypt.hash('password', saltRounds),
        dni: faker.string.numeric(10),
        address: faker.location.streetAddress(),
        id_rol: 1,
        contact: '789654',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: faker.person.fullName(),
        email: 'owner_1@example.com',
        password: await bcrypt.hash('password', saltRounds),
        dni: faker.string.numeric(10),
        address: faker.location.streetAddress(),
        id_rol: 2,
        contact: '789654',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: faker.person.fullName(),
        email: 'owner_2@example.com',
        password: await bcrypt.hash('password', saltRounds),
        dni: faker.string.numeric(10),
        address: faker.location.streetAddress(),
        id_rol: 2,
        contact: '789654',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: faker.person.fullName(),
        email: 'user@example.com',
        password: await bcrypt.hash('password', saltRounds),
        dni: faker.string.numeric(10),
        address: faker.location.streetAddress(),
        id_rol: 3,
        contact: '789654',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    return await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@example.com', 'owner_1@example.com', 'owner_2@example.com', 'user@example.com']
      }
    }, {});
  }
};
