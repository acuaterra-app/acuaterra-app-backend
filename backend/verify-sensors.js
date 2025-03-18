const { sequelize } = require('./models');

async function verifyTables() {
  try {
    const [tables] = await sequelize.query('SHOW TABLES;');
    console.log('Tablas en la base de datos:');
    console.log(JSON.stringify(tables, null, 2));

    const [migrations] = await sequelize.query('SELECT * FROM SequelizeMeta ORDER BY name;');
    console.log('\nMigraciones aplicadas:');
    console.log(JSON.stringify(migrations, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

verifyTables();

