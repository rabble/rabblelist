#!/usr/bin/env node

/**
 * Contact Manager PWA - Unified Setup Script
 * Combines all database setup functionality into one script
 * 
 * Usage:
 *   npm run setup:all    - Run complete setup (schema + seed data + demo user)
 *   npm run setup:schema - Run only schema setup
 *   npm run setup:seed   - Run only seed data
 *   npm run setup:demo   - Run only demo user setup
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!')
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Execute SQL file statement by statement
 */
async function executeSQLFile(filePath, description) {
  console.log(`\n📄 ${description}...`)
  console.log(`   File: ${filePath}`)
  
  try {
    const sql = readFileSync(filePath, 'utf8')
    
    // For now, we'll provide manual instructions since direct SQL execution
    // requires special setup with Supabase
    console.log(`   ⚠️  Direct SQL execution requires Supabase CLI or direct database access`)
    console.log(`   📋 Please run this SQL manually in Supabase Dashboard`)
    
    return { manual: true, sql }
  } catch (error) {
    console.error(`❌ Failed to read SQL file: ${error.message}`)
    throw error
  }
}

/**
 * Setup demo user with proper auth
 */
async function setupDemoUser() {
  console.log('\n👤 Setting up demo user...')
  
  try {
    // Fixed organization ID for demo
    const demoOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    
    // 1. Ensure demo organization exists
    console.log('   Creating demo organization...')
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: demoOrgId,
        name: 'Demo Organization',
        country_code: 'US',
        settings: { demo: true },
        features: {
          calling: true,
          events: true,
          imports: true,
          groups: true,
          pathways: true
        }
      })
    
    if (orgError && !orgError.message.includes('duplicate')) {
      console.error('   ❌ Organization error:', orgError.message)
    }
    
    // 2. Create or update auth user
    console.log('   Creating demo auth user...')
    let userId = null
    
    // Try to create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo@example.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: { full_name: 'Demo User' }
    })
    
    if (createError) {
      if (createError.message.includes('already been registered')) {
        // User exists, get their ID
        console.log('   Demo user already exists, updating...')
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const demoUser = users?.find(u => u.email === 'demo@example.com')
        
        if (demoUser) {
          userId = demoUser.id
          // Update password
          await supabase.auth.admin.updateUserById(demoUser.id, { 
            password: 'demo123' 
          })
        }
      } else {
        throw createError
      }
    } else if (userData?.user) {
      userId = userData.user.id
    }
    
    // 3. Create user profile
    if (userId) {
      console.log('   Creating user profile...')
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: 'demo@example.com',
          full_name: 'Demo User',
          organization_id: demoOrgId,
          role: 'admin',
          settings: { demo: true },
          phone: '+1234567890',
          last_active: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('   ❌ Profile error:', profileError.message)
      } else {
        console.log('   ✅ Demo user setup complete!')
      }
    }
    
    return { success: true, userId }
  } catch (error) {
    console.error('❌ Demo user setup failed:', error.message)
    return { success: false, error }
  }
}

/**
 * Show manual setup instructions
 */
function showManualInstructions() {
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
  
  console.log('\n📋 Manual Setup Instructions')
  console.log('============================')
  console.log('\n1. Go to Supabase SQL Editor:')
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  console.log('\n2. Run these SQL files in order:')
  console.log('   a) Copy/paste contents of: supabase/schema.sql')
  console.log('   b) Click "Run" and wait for completion')
  console.log('   c) Copy/paste contents of: supabase/seed-data.sql')
  console.log('   d) Click "Run" and wait for completion')
  console.log('\n3. Come back here and run: npm run setup:demo')
  console.log('\n4. Start the app: npm run dev')
  console.log('\n5. Login with: demo@example.com / demo123')
}

/**
 * Main setup orchestrator
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'
  
  console.log('🚀 Contact Manager PWA Setup')
  console.log('============================')
  
  try {
    // Test connection
    console.log('\n🔍 Testing database connection...')
    const { error: connError } = await supabase.from('organizations').select('count').limit(1)
    
    if (connError && connError.code !== '42P01') { // 42P01 = table doesn't exist
      throw new Error(`Connection failed: ${connError.message}`)
    }
    console.log('   ✅ Connected to Supabase')
    
    switch (command) {
      case 'schema':
        await executeSQLFile(
          join(__dirname, '..', 'supabase', 'schema.sql'),
          'Database Schema Setup'
        )
        showManualInstructions()
        break
        
      case 'seed':
        await executeSQLFile(
          join(__dirname, '..', 'supabase', 'seed-data.sql'),
          'Seed Data Setup'
        )
        showManualInstructions()
        break
        
      case 'demo':
        const result = await setupDemoUser()
        if (result.success) {
          console.log('\n✅ Demo user ready!')
          console.log('   Email: demo@example.com')
          console.log('   Password: demo123')
        }
        break
        
      case 'all':
      default:
        // Run everything
        console.log('\n📦 Running complete setup...')
        
        // Show schema setup instructions
        await executeSQLFile(
          join(__dirname, '..', 'supabase', 'schema.sql'),
          'Database Schema'
        )
        
        await executeSQLFile(
          join(__dirname, '..', 'supabase', 'seed-data.sql'),
          'Seed Data'
        )
        
        showManualInstructions()
        
        console.log('\n⏸️  After running the SQL files above, run:')
        console.log('   npm run setup:demo')
        break
    }
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { executeSQLFile, setupDemoUser, main }