'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('farms', 'latitude', {
    type: Sequelize.FLOAT,
    allowNull: true
    });
    
    await queryInterface.changeColumn('farms', 'longitude', {
    type: Sequelize.FLOAT,
    allowNull: true
    });
},

async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('farms', 'latitude', {
    type: Sequelize.STRING,
    allowNull: true
    });
    
    await queryInterface.changeColumn('farms', 'longitude', {
    type: Sequelize.STRING,
    allowNull: true
    });
}
};

