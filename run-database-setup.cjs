#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('Invalid Supabase URL format');
  process.exit(1);
}

function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...`);
    console.log(`Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${description} failed:`);
        console.error('Error:', error.message);
        if (stderr) console.error('Stderr:', stderr);
        reject(error);
      } else {
        console.log(`✅ ${description} completed`);
        if (stdout) console.log('Output:', stdout);
        resolve(stdout);
      }
    });
  });
}

async function main() {
  console.log('🚀 Contact Manager PWA - Database Setup');
  console.log('========================================');
  console.log(`Project: ${projectRef}`);
  
  try {
    // Method 1: Try using supabase CLI with auth
    console.log('\n📝 Attempting to use Supabase CLI...');
    
    // Link project first
    await executeCommand(
      `supabase link --project-ref ${projectRef}`,
      'Linking to Supabase project'
    );
    
    // Try to execute schema using supabase db push
    const schemaPath = path.join(__dirname, 'supabase', 'complete_setup.sql');
    const seedPath = path.join(__dirname, 'supabase', 'seed.sql');
    
    // Create a temporary SQL file that combines both
    const combinedSQL = 
      fs.readFileSync(schemaPath, 'utf8') + 
      '\n\n-- SEED DATA\n\n' + 
      fs.readFileSync(seedPath, 'utf8');
    
    const tempSQLPath = path.join(__dirname, 'temp_setup.sql');
    fs.writeFileSync(tempSQLPath, combinedSQL);
    
    console.log(`\n📄 Created temporary SQL file: ${tempSQLPath}`);
    console.log(`SQL file size: ${combinedSQL.length} characters`);
    
    // Method 2: Try direct psql connection
    const dbUrl = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
    
    await executeCommand(
      `PGPASSWORD="${supabaseServiceKey}" psql "${dbUrl}" -f "${tempSQLPath}"`,
      'Executing SQL via direct PostgreSQL connection'
    );
    
    // Clean up
    fs.unlinkSync(tempSQLPath);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('\n💥 Database setup failed. Trying alternative method...');
    
    // Alternative: Write instructions for manual execution
    console.log('\n📋 Manual Setup Instructions:');
    console.log('=============================');
    console.log('1. Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new');
    console.log('2. Copy and paste the contents of: supabase/complete_setup.sql');
    console.log('3. Click "Run" to execute');
    console.log('4. Copy and paste the contents of: supabase/seed.sql');
    console.log('5. Click "Run" to execute');
    
    console.log('\n🔧 Error details:', error.message);
  }
}

main();