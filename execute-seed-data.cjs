#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertDemoData() {
  console.log('🚀 Inserting demo data directly via REST API...');
  
  try {
    // 1. Insert demo organization
    console.log('📄 Creating demo organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert([{
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Demo Organization',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (orgError) throw orgError;
    console.log('✅ Organization created');

    // 2. Insert demo contacts
    console.log('📄 Creating demo contacts...');
    const contacts = [
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1-555-0123',
        status: 'active',
        tags: ['volunteer', 'core-team'],
        source: 'manual',
        engagement_score: 85
      },
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Mike Chen',
        email: 'mike.chen@example.com',
        phone: '+1-555-0124',
        status: 'active',
        tags: ['donor', 'phone-banker'],
        source: 'event',
        engagement_score: 70
      },
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Emily Rodriguez',
        email: 'emily.r@example.com',
        phone: '+1-555-0125',
        status: 'active',
        tags: ['volunteer'],
        source: 'referral',
        engagement_score: 60
      }
    ];

    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();
    
    if (contactsError) throw contactsError;
    console.log(`✅ ${contactsData.length} contacts created`);

    // 3. Insert demo groups
    console.log('📄 Creating demo groups...');
    const groups = [
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        name: 'Core Volunteers',
        description: 'Our most active and reliable volunteers',
        tags: ['volunteers', 'core'],
        is_active: true,
        group_type: 'volunteer_team',
        member_count: 0
      },
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        name: 'Phone Bank Team',
        description: 'Volunteers who make calls for campaigns',
        tags: ['phone-bank', 'outreach'],
        is_active: true,
        group_type: 'action_team',
        member_count: 0
      }
    ];

    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .insert(groups)
      .select();
    
    if (groupsError) throw groupsError;
    console.log(`✅ ${groupsData.length} groups created`);

    // 4. Insert demo events
    console.log('📄 Creating demo events...');
    const events = [
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        name: 'Community Organizing Workshop',
        description: 'Learn the fundamentals of community organizing',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        event_type: 'workshop',
        location: 'Community Center',
        capacity: 50,
        tags: ['training', 'organizing'],
        is_published: true,
        registration_required: true
      }
    ];

    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .insert(events)
      .select();
    
    if (eventsError) throw eventsError;
    console.log(`✅ ${eventsData.length} events created`);

    // 5. Insert demo campaigns
    console.log('📄 Creating demo campaigns...');
    const campaigns = [
      {
        organization_id: '00000000-0000-0000-0000-000000000001',
        name: 'Climate Action Now',
        description: 'Demand 100% renewable energy by 2030',
        type: 'petition',
        status: 'active',
        goal: 5000,
        current_value: 3847,
        start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .insert(campaigns)
      .select();
    
    if (campaignsError) throw campaignsError;
    console.log(`✅ ${campaignsData.length} campaigns created`);

    console.log('\n🎉 Demo data inserted successfully!');
    console.log('✨ You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error inserting demo data:', error.message);
    console.error('Details:', error);
  }
}

insertDemoData();