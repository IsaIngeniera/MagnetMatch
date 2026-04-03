/**
 * Database Synchronization Script
 * 
 * This script creates all tables based on the Sequelize models.
 * Use { force: true } to drop and recreate all tables (WARNING: data loss)
 * Use { alter: true } to update tables without losing data
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize } = require('../models');

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...');
    console.log(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

    // Use force: false and alter: true to update schema without losing data
    // Change to { force: true } to completely recreate all tables
    await sequelize.sync({ alter: true });

    console.log('\nDatabase synchronized successfully!');
    console.log('Tables created/updated:');
    console.log('  - aspirante');
    console.log('  - empresa');
    console.log('  - experiencia');
    console.log('  - educacion');
    console.log('  - habilidad');
    console.log('  - aspirante_habilidad');
    console.log('  - logro');
    console.log('  - vacante');
    console.log('  - vacante_habilidad');
    console.log('  - match_recomendacion');

    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

syncDatabase();
