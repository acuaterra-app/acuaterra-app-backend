'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const [moduleRows] = await queryInterface.sequelize.query('SELECT id FROM modules');

        if (moduleRows.length === 0) {
            console.warn('No modules found, skipping sensor seeding.');
            return;
        }

        const sensors = [
            {
                name: `Sensor Temperature ${faker.number.int({ min: 1, max: 100 })}`,
                type: 'Temperature',
                id: faker.helpers.arrayElement(moduleRows).id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: `Sensor Proximity ${faker.number.int({ min: 1, max: 100 })}`,
                type: 'Proximity',
                id: faker.helpers.arrayElement(moduleRows).id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await queryInterface.bulkInsert('sensors', sensors, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('sensors', null, {});
    }
};
