#!/usr/bin/env node

const { Client } = require('pg');

// Connection string from the Supabase dashboard
const connectionString = 'postgresql://postgres:[YOUR-PASSWORD]@db.oxtjonaiubulnggytezf.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: connectionString.replace('[YOUR-PASSWORD]', process.env.SUPABASE_DB_PASSWORD),
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Add the full_name column
    console.log('Adding full_name column...');
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS full_name TEXT');

    // Populate full_name from existing data
    console.log('Populating full_name from first_name and last_name...');
    await client.query(`
      UPDATE contacts 
      SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
      WHERE full_name IS NULL
    `);

    // Check if we have data to verify
    const { rows } = await client.query('SELECT id, first_name, last_name, full_name FROM contacts LIMIT 5');
    console.log('Sample data after update:', rows);

    // Make full_name NOT NULL
    console.log('Making full_name NOT NULL...');
    await client.query('ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL');

    // Drop the old columns
    console.log('Dropping first_name and last_name columns...');
    await client.query('ALTER TABLE contacts DROP COLUMN IF EXISTS first_name');
    await client.query('ALTER TABLE contacts DROP COLUMN IF EXISTS last_name');

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check for password
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Please set SUPABASE_DB_PASSWORD environment variable');
  console.error('You can find this in your Supabase dashboard under Settings > Database');
  process.exit(1);
}

runMigration();