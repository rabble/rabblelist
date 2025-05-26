#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oxtjonaiubulnggytezf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // Need service key for schema changes

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_KEY environment variable')
  console.error('You can find this in your Supabase dashboard under Settings > API')
  console.error('Use the "service_role" key (secret), not the "anon" key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('Starting migration to change first_name/last_name to full_name...')

    // First, let's check current data
    const { data: sampleBefore, error: sampleError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(5)

    if (sampleError) throw sampleError
    console.log('Sample data before migration:', sampleBefore)

    // Use RPC to run the migration as it needs DDL permissions
    const { error: migrationError } = await supabase.rpc('run_migration', {
      migration_sql: `
        -- Add the full_name column if it doesn't exist
        ALTER TABLE contacts ADD COLUMN IF NOT EXISTS full_name TEXT;

        -- Populate full_name from existing data
        UPDATE contacts 
        SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
        WHERE full_name IS NULL;

        -- Make full_name NOT NULL
        ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL;

        -- Drop the old columns
        ALTER TABLE contacts DROP COLUMN IF EXISTS first_name;
        ALTER TABLE contacts DROP COLUMN IF EXISTS last_name;
      `
    })

    if (migrationError) {
      console.error('Migration failed:', migrationError)
      
      // If RPC doesn't exist, we need to do it differently
      console.log('\nTrying alternative approach...')
      
      // Since we can't run DDL through Supabase client, let's create a SQL function
      console.log('Please run the following SQL in your Supabase SQL editor:')
      console.log(`
-- Run this in the Supabase SQL editor:
BEGIN;

-- Add the full_name column
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Populate full_name from existing data  
UPDATE contacts 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL;

-- Make full_name NOT NULL
ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL;

-- Drop the old columns
ALTER TABLE contacts DROP COLUMN IF EXISTS first_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS last_name;

COMMIT;
      `)
      return
    }

    // Check the result
    const { data: sampleAfter, error: afterError } = await supabase
      .from('contacts')
      .select('id, full_name')
      .limit(5)

    if (afterError) throw afterError
    console.log('Sample data after migration:', sampleAfter)
    console.log('Migration completed successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

runMigration()