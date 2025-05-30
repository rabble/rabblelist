#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Please add it to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filePath, description) {
  console.log(`\n📄 ${description}...`);
  console.log(`File: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sql
      .split(/;\s*$(?=(?:[^']*'[^']*')*[^']*$)/m)
      .filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      // Skip comments
      if (stmt.startsWith('--')) continue;
      
      try {
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: stmt + ';' 
        }).single();
        
        if (error) {
          console.error(`Statement ${i + 1} failed:`, error.message);
        } else {
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log(`\n✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Running all SQL files for Contact Manager PWA');
  console.log('================================================');
  
  try {
    // Run schema first
    await executeSQLFile(
      path.join(__dirname, 'supabase', 'schema.sql'),
      'Base schema setup'
    );
    
    // Run migrations in order
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const migration of migrations) {
      await executeSQLFile(
        path.join(migrationsDir, migration),
        `Migration: ${migration}`
      );
    }
    
    // Run seed data
    await executeSQLFile(
      path.join(__dirname, 'supabase', 'seed-data.sql'),
      'Demo seed data'
    );
    
    console.log('\n🎉 All SQL files executed successfully!');
    console.log('\n✨ Now run: npm run setup:demo');
    
  } catch (error) {
    console.error('\n💥 SQL execution failed:', error.message);
    console.log('\n📋 Alternative: Manual Setup');
    console.log('1. Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new');
    console.log('2. Run each file in order:');
    console.log('   - supabase/schema.sql');
    console.log('   - supabase/migrations/*.sql (in order)');
    console.log('   - supabase/seed-data.sql');
  }
}

main();