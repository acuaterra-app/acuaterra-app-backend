const { sequelize } = require('./models');

async function verifyFarmsTable() {
  try {
    const [result] = await sequelize.query(`
      DESCRIBE farms;
    `);
    console.log('Estructura de la tabla farms:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

verifyFarmsTable();

