#!/usr/bin/env node

/**
 * Script to create a demo user in Supabase
 * Run with: node scripts/setup-demo-user.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables!')
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

async function setupDemoUser() {
  try {
    console.log('Setting up demo user...')

    // Step 1: Create demo organization with proper UUID
    console.log('Creating demo organization...')
    const demoOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Fixed UUID from migrations
    const { data: orgData, error: orgError } = await supabase
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
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      // Continue anyway, might already exist
    } else {
      console.log('✓ Demo organization created')
    }

    // Step 2: Create auth user
    console.log('Creating demo auth user...')
    let userId = null
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'demo@example.com',
      password: 'demo123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Demo User'
      }
    })

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log('Demo user already exists, updating...')
        // Update existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (!listError && users) {
          const demoUser = users.users.find(u => u.email === 'demo@example.com')
          if (demoUser) {
            userId = demoUser.id
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              demoUser.id,
              { password: 'demo123' }
            )
            if (updateError) {
              console.error('Error updating user password:', updateError)
            } else {
              console.log('✓ Demo user password updated')
            }
          }
        }
      } else {
        console.error('Error creating user:', userError)
        return
      }
    } else if (userData?.user) {
      userId = userData.user.id
      console.log('✓ Demo auth user created')
    }

    // Step 3: Create user profile
    if (userId) {
      console.log('Creating user profile...')
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
        console.error('Error creating user profile:', profileError)
      } else {
        console.log('✓ User profile created')
      }
    }

    // Step 4: Add demo contacts
    console.log('Adding demo contacts...')
    const contacts = [
      { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', phone: '+1234567890', status: 'active', tags: ['prospect', 'high-value'], custom_fields: { company: 'Acme Corp', position: 'CEO' }, source: 'manual', engagement_score: 85 },
      { first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', phone: '+1234567891', status: 'active', tags: ['customer'], custom_fields: { company: 'Tech Solutions', position: 'CTO' }, source: 'import', engagement_score: 92 },
      { first_name: 'Bob', last_name: 'Johnson', email: 'bob.johnson@example.com', phone: '+1234567892', status: 'active', tags: ['lead'], custom_fields: { company: 'StartupXYZ', position: 'Founder' }, source: 'manual', engagement_score: 67 },
      { first_name: 'Alice', last_name: 'Williams', email: 'alice.williams@example.com', phone: '+1234567893', status: 'inactive', tags: ['past-customer'], custom_fields: { company: 'Global Inc', position: 'VP Sales' }, source: 'import', engagement_score: 45 },
      { first_name: 'Charlie', last_name: 'Brown', email: 'charlie.brown@example.com', phone: '+1234567894', status: 'active', tags: ['prospect', 'warm-lead'], custom_fields: { company: 'Innovation Labs', position: 'Director' }, source: 'api', engagement_score: 78 }
    ]

    for (const contact of contacts) {
      const { error } = await supabase
        .from('contacts')
        .upsert({
          ...contact,
          organization_id: demoOrgId,
          created_by: userId
        })
      
      if (error) {
        console.error(`Error creating contact ${contact.email}:`, error)
      }
    }
    console.log('✓ Demo contacts added')

    // Step 5: Add demo events
    console.log('Adding demo events...')
    const events = [
      { name: 'Product Launch Webinar', description: 'Join us for our exciting new product launch', event_type: 'webinar', location: 'Online', capacity: 500, settings: { platform: 'Zoom' }, tags: ['product', 'launch'], is_published: true, registration_required: true },
      { name: 'Customer Success Workshop', description: 'Learn best practices for customer success', event_type: 'workshop', location: '123 Main St, New York, NY', capacity: 50, settings: { catering: true }, tags: ['training', 'customers'], is_published: true, registration_required: true },
      { name: 'Annual Conference', description: 'Our biggest event of the year', event_type: 'conference', location: 'Convention Center, San Francisco, CA', capacity: 1000, settings: { multi_day: true }, tags: ['annual', 'networking'], is_published: true, registration_required: true }
    ]

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      const { error } = await supabase
        .from('events')
        .upsert({
          ...event,
          organization_id: demoOrgId,
          created_by: userId,
          event_date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString() // 7, 14, 21 days from now
        })
      
      if (error) {
        console.error(`Error creating event ${event.name}:`, error)
      }
    }
    console.log('✓ Demo events added')

    console.log('\n✅ Demo setup complete!')
    console.log('\nYou can now log in with:')
    console.log('Email: demo@example.com')
    console.log('Password: demo123')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

setupDemoUser()