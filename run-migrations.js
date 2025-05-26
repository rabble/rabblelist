#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigrations() {
  console.log('🚀 Running database migrations...\n')

  try {
    // Read the migration files
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'supabase/migrations/001_complete_schema.sql'), 'utf8')
    const seedSQL = fs.readFileSync(path.join(__dirname, 'supabase/migrations/002_seed_data.sql'), 'utf8')

    // Split into individual statements (simple split by semicolon)
    const schemaStatements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📋 Found ${schemaStatements.length} schema statements to run`)

    // Run schema statements
    for (let i = 0; i < schemaStatements.length; i++) {
      const statement = schemaStatements[i] + ';'
      
      try {
        console.log(`Running statement ${i + 1}/${schemaStatements.length}...`)
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).single()
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        }
      } catch (err) {
        console.error(`❌ Failed to run statement ${i + 1}:`, err.message)
      }
    }

    console.log('\n✅ Schema migration complete!')
    console.log('\n📋 Now create the demo user:')
    console.log('1. Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/auth/users')
    console.log('2. Create user: demo@example.com / demo123 (Auto confirm email: ✓)')
    console.log('3. Then run: node run-migrations.js --seed')

    if (process.argv.includes('--seed')) {
      console.log('\n🌱 Running seed data...')
      
      const seedStatements = seedSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (let i = 0; i < seedStatements.length; i++) {
        const statement = seedStatements[i] + ';'
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          }).single()
          
          if (error) {
            console.error(`❌ Error in seed statement ${i + 1}:`, error.message)
          }
        } catch (err) {
          console.error(`❌ Failed to run seed statement ${i + 1}:`, err.message)
        }
      }
      
      console.log('\n✅ Seed data complete!')
    }

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run the migrations
runMigrations()