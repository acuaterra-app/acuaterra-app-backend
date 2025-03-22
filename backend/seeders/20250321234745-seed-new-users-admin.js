'use strict';
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUsers = [
      {
        name: 'Admin 1',
        email: 'administrator1@example.com',
        password: await bcrypt.hash('Admin123', 10),
        dni: faker.string.numeric(10),
        id_rol: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: 'Dirección Admin 1',
        contact: '111111111',
      },
      {
        name: 'Admin 2',
        email: 'administrator2@example.com',
        password: await bcrypt.hash('Admin123', 10),
        dni: faker.string.numeric(10),
        id_rol: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: 'Dirección Admin 2',
        contact: '222222222',
      },
      {
        name: 'Admin 3',
        email: 'administrator3@example.com',
        password: await bcrypt.hash('Admin123', 10),
        dni: faker.string.numeric(10),
        id_rol: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: 'Dirección Admin 3',
        contact: '333333333',
      },
    ];

    const existingUsers = await queryInterface.sequelize.query(
        `SELECT email FROM Users WHERE email IN (${adminUsers
            .map((user) => `'${user.email}'`)
            .join(', ')})`
    );

    const existingEmails = existingUsers[0].map((user) => user.email);

    const newUsers = adminUsers.filter(
        (user) => !existingEmails.includes(user.email)
    );

    if (newUsers.length > 0) {
      await queryInterface.bulkInsert('Users', newUsers, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      email: ['admin1@example.com', 'admin2@example.com', 'admin3@example.com'],
    });
  },
};