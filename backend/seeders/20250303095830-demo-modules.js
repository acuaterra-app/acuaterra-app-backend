'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [farmRows] = await queryInterface.sequelize.query('SELECT id FROM farms');
    
    const fishSpecies = ['Tilapia', 'Trout', 'Salmon', 'Catfish', 'Carp', 'Bass', 'Cod', 'Tuna'];
    
    await queryInterface.bulkInsert('modules', [
      {
        name: `Module ${faker.word.adjective()}`,
        location: faker.location.buildingNumber() + ' ' + faker.location.direction() + ' Wing',
        species_fish: faker.helpers.arrayElement(fishSpecies),
        fish_quantity: faker.number.int({ min: 50, max: 500 }),
        fish_age: faker.number.int({ min: 1, max: 12 }),
        dimensions: `${faker.number.int({ min: 2, max: 8 })}x${faker.number.int({ min: 2, max: 10 })}x${faker.number.int({ min: 1, max: 4 })}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        created_by_user_id: 1,
        id_farm: faker.helpers.arrayElement(farmRows).id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `Module ${faker.word.adjective()}`,
        location: faker.location.buildingNumber() + ' ' + faker.location.direction() + ' Wing',
        species_fish: faker.helpers.arrayElement(fishSpecies),
        fish_quantity: faker.number.int({ min: 50, max: 500 }),
        fish_age: faker.number.int({ min: 1, max: 12 }),
        dimensions: `${faker.number.int({ min: 2, max: 8 })}x${faker.number.int({ min: 2, max: 10 })}x${faker.number.int({ min: 1, max: 4 })}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        created_by_user_id: 1,
        id_farm: faker.helpers.arrayElement(farmRows).id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `Module ${faker.word.adjective()}`,
        location: faker.location.buildingNumber() + ' ' + faker.location.direction() + ' Wing',
        species_fish: faker.helpers.arrayElement(fishSpecies),
        fish_quantity: faker.number.int({ min: 50, max: 500 }),
        fish_age: faker.number.int({ min: 1, max: 12 }),
        dimensions: `${faker.number.int({ min: 2, max: 8 })}x${faker.number.int({ min: 2, max: 10 })}x${faker.number.int({ min: 1, max: 4 })}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        created_by_user_id: 1,
        id_farm: faker.helpers.arrayElement(farmRows).id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `Module ${faker.word.adjective()}`,
        location: faker.location.buildingNumber() + ' ' + faker.location.direction() + ' Wing',
        species_fish: faker.helpers.arrayElement(fishSpecies),
        fish_quantity: faker.number.int({ min: 50, max: 500 }),
        fish_age: faker.number.int({ min: 1, max: 12 }),
        dimensions: `${faker.number.int({ min: 2, max: 8 })}x${faker.number.int({ min: 2, max: 10 })}x${faker.number.int({ min: 1, max: 4 })}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        created_by_user_id: 1,
        id_farm: faker.helpers.arrayElement(farmRows).id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `Module ${faker.word.adjective()}`,
        location: faker.location.buildingNumber() + ' ' + faker.location.direction() + ' Wing',
        species_fish: faker.helpers.arrayElement(fishSpecies),
        fish_quantity: faker.number.int({ min: 50, max: 500 }),
        fish_age: faker.number.int({ min: 1, max: 12 }),
        dimensions: `${faker.number.int({ min: 2, max: 8 })}x${faker.number.int({ min: 2, max: 10 })}x${faker.number.int({ min: 1, max: 4 })}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        created_by_user_id: 1,
        id_farm: faker.helpers.arrayElement(farmRows).id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('modules', null, {});
  }
};

