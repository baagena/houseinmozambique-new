const { Client } = require('pg');
require('dotenv').config();

// Use the URL pointing to neondb to create the new database
const connectionString = process.env.DATABASE_URL.replace('houseinmozambique-new', 'neondb');

async function createDb() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to neondb');
    await client.query('CREATE DATABASE "houseinmozambique-new"');
    console.log('Database "houseinmozambique-new" created successfully');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database "houseinmozambique-new" already exists');
    } else {
      console.error('Error creating database:', err);
    }
  } finally {
    await client.end();
  }
}

createDb();
