import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDemoData() {
  try {
    console.log('Starting to add demo data...')
    
    // Get demo user
    const { data: users } = await supabase.auth.admin.listUsers()
    const demoUser = users.users.find(u => u.email === 'demo@example.com')
    
    if (!demoUser) {
      console.error('Demo user not found!')
      return
    }
    
    const demoUserId = demoUser.id
    const demoOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    
    console.log('Found demo user:', demoUserId)
    
    // Add contacts
    const contacts = [
      {
        organization_id: demoOrgId,
        full_name: 'Maria Rodriguez',
        email: 'maria.rodriguez@email.com',
        phone: '+1234567001',
        status: 'active',
        tags: ['community-leader', 'volunteer', 'high-engagement'],
        custom_fields: { preferred_contact: 'phone', language: 'Spanish', district: 'Downtown' },
        notes: 'Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'James Chen',
        email: 'james.chen@email.com',
        phone: '+1234567002',
        status: 'active',
        tags: ['volunteer', 'event-organizer', 'youth-leader'],
        custom_fields: { preferred_contact: 'email', skills: ['social media', 'graphic design'], district: 'Eastside' },
        notes: 'Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Sarah Thompson',
        email: 'sarah.t@email.com',
        phone: '+1234567003',
        status: 'active',
        tags: ['donor', 'board-member', 'high-value'],
        custom_fields: { preferred_contact: 'email', donation_history: '$5000', employer: 'Tech Corp', district: 'Northside' },
        notes: 'Board member and major donor. Works in tech sector. Interested in education reform.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'David Kim',
        email: 'dkim@email.com',
        phone: '+1234567004',
        status: 'active',
        tags: ['volunteer', 'canvasser', 'phone-banker'],
        custom_fields: { availability: 'weekends', languages: ['English', 'Korean'], district: 'Westside' },
        notes: 'Reliable weekend volunteer. Bilingual - helps with Korean community outreach.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Lisa Johnson',
        email: 'lisa.j@email.com',
        phone: '+1234567005',
        status: 'active',
        tags: ['volunteer', 'event-support', 'social-media'],
        custom_fields: { skills: ['photography', 'writing'], district: 'Downtown' },
        notes: 'Helps with event photography and social media posts. Former journalist.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Robert Williams',
        email: 'rwilliams@email.com',
        phone: '+1234567006',
        status: 'active',
        tags: ['volunteer', 'driver', 'setup-crew'],
        custom_fields: { has_vehicle: true, availability: 'flexible', district: 'Southside' },
        notes: 'Has a van - helps transport supplies and people to events. Very dependable.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Emily Brown',
        email: 'emily.brown@email.com',
        phone: '+1234567007',
        status: 'active',
        tags: ['prospect', 'interested', 'parent'],
        custom_fields: { interests: ['education', 'school-funding'], children: 2, district: 'Eastside' },
        notes: 'Met at PTA meeting. Interested in education advocacy. Has two kids in public school.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Michael Davis',
        email: 'mdavis@email.com',
        phone: '+1234567008',
        status: 'active',
        tags: ['lead', 'union-member', 'warm-lead'],
        custom_fields: { union: 'Teachers Union', interests: ['labor-rights'], district: 'Downtown' },
        notes: 'Teacher at Lincoln High. Expressed interest in organizing fellow teachers.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Angela White',
        email: 'angela.w@email.com',
        phone: '+1234567009',
        status: 'active',
        tags: ['prospect', 'small-business', 'community-supporter'],
        custom_fields: { business: "White's Bakery", interests: ['local-economy'], district: 'Northside' },
        notes: 'Owns local bakery. Supports community events. Potential sponsor.',
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        full_name: 'Patricia Martinez',
        email: 'pmartinez@email.com',
        phone: '+1234567010',
        status: 'inactive',
        tags: ['past-volunteer', 'donor', 'reactivation-target'],
        custom_fields: { last_activity: '2023-06-15', past_donations: '$500', district: 'Westside' },
        notes: 'Former active volunteer. Moved but still in area. Worth re-engaging.',
        created_by: demoUserId,
        updated_by: demoUserId
      }
    ]
    
    console.log('Adding contacts...')
    const { data: insertedContacts, error: contactError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select()
    
    if (contactError) {
      console.error('Error adding contacts:', contactError)
      return
    }
    
    console.log(`Added ${insertedContacts.length} contacts`)
    
    // Add events
    const events = [
      {
        organization_id: demoOrgId,
        name: 'Community Justice Rally',
        description: 'Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        location: { venue: 'City Hall Plaza', address: '123 Main St', city: 'Downtown', instructions: 'Meet at the main steps' },
        capacity: 500,
        event_type: 'rally',
        status: 'scheduled',
        tags: ['rally', 'justice', 'community'],
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        name: 'New Volunteer Orientation',
        description: 'Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.',
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        location: { venue: 'Community Center', address: '456 Oak Ave', room: 'Conference Room A' },
        capacity: 30,
        event_type: 'training',
        status: 'scheduled',
        tags: ['training', 'volunteers', 'orientation'],
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        name: 'Phone Bank for Change',
        description: "Join us for phone banking! We'll be calling supporters to mobilize for upcoming actions.",
        start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        location: { venue: 'Campaign HQ', address: '789 Elm St', parking: 'Free parking in rear' },
        capacity: 20,
        event_type: 'phone_bank',
        status: 'scheduled',
        tags: ['phone-bank', 'outreach', 'volunteers'],
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        name: 'Voter Registration Drive',
        description: 'Successful voter registration drive in the downtown area.',
        start_time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        location: { venue: 'Downtown Park', address: '100 Park Ave' },
        capacity: 100,
        event_type: 'canvass',
        status: 'completed',
        tags: ['voter-reg', 'outreach', 'success'],
        notes: 'Great turnout! Registered 47 new voters. Maria Rodriguez brought 5 volunteers.',
        created_by: demoUserId,
        updated_by: demoUserId
      }
    ]
    
    console.log('Adding events...')
    const { data: insertedEvents, error: eventError } = await supabase
      .from('events')
      .insert(events)
      .select()
    
    if (eventError) {
      console.error('Error adding events:', eventError)
      return
    }
    
    console.log(`Added ${insertedEvents.length} events`)
    
    // Add some call history
    if (insertedContacts && insertedContacts.length > 0) {
      const calls = []
      for (let i = 0; i < Math.min(5, insertedContacts.length); i++) {
        calls.push({
          organization_id: demoOrgId,
          contact_id: insertedContacts[i].id,
          direction: 'outbound',
          duration: Math.floor(Math.random() * 300 + 60),
          status: 'completed',
          outcome: 'answered',
          notes: 'Spoke with contact about upcoming rally. They confirmed attendance.',
          scheduled_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          caller_id: demoUserId,
          created_by: demoUserId,
          updated_by: demoUserId
        })
      }
      
      console.log('Adding call history...')
      const { error: callError } = await supabase
        .from('calls')
        .insert(calls)
      
      if (callError) {
        console.error('Error adding calls:', callError)
      } else {
        console.log(`Added ${calls.length} call records`)
      }
    }
    
    // Add groups
    const groups = [
      {
        organization_id: demoOrgId,
        name: 'Core Volunteers',
        description: 'Our most active and reliable volunteers',
        tags: ['active', 'volunteers'],
        created_by: demoUserId,
        updated_by: demoUserId
      },
      {
        organization_id: demoOrgId,
        name: 'Major Donors',
        description: 'Donors who have contributed over $1000',
        tags: ['donors', 'high-value'],
        created_by: demoUserId,
        updated_by: demoUserId
      }
    ]
    
    console.log('Adding groups...')
    const { data: insertedGroups, error: groupError } = await supabase
      .from('groups')
      .insert(groups)
      .select()
    
    if (groupError) {
      console.error('Error adding groups:', groupError)
    } else {
      console.log(`Added ${insertedGroups.length} groups`)
    }
    
    // Add campaigns
    const campaigns = [
      {
        organization_id: demoOrgId,
        name: 'Justice for All 2024',
        description: 'Our major campaign for criminal justice reform. Focus on bail reform and police accountability.',
        status: 'active',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        goals: { contacts_goal: 1000, events_goal: 10, volunteers_goal: 50 },
        metrics: { contacts_reached: 245, events_held: 3, volunteers_active: 22 },
        tags: ['justice', 'reform', '2024'],
        created_by: demoUserId,
        updated_by: demoUserId
      }
    ]
    
    console.log('Adding campaigns...')
    const { error: campaignError } = await supabase
      .from('campaigns')
      .insert(campaigns)
    
    if (campaignError) {
      console.error('Error adding campaigns:', campaignError)
    } else {
      console.log('Added campaign')
    }
    
    console.log('Demo data added successfully!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addDemoData()