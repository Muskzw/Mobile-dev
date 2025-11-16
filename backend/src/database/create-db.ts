import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  // Connect to default postgres database to create our database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL');

    const dbName = process.env.DB_NAME || 'quotation_maker';

    // Check if database exists
    const checkResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      // Create database
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully!`);
    }

    await adminClient.end();
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log(`Database '${process.env.DB_NAME}' already exists.`);
    } else {
      console.error('Error creating database:', error.message);
      console.error('\nPlease create the database manually:');
      console.error(`  CREATE DATABASE ${process.env.DB_NAME || 'quotation_maker'};`);
      console.error('\nOr use pgAdmin to create it.');
      process.exit(1);
    }
  }
}

createDatabase();

