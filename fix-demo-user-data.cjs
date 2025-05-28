#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials.');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDemoUserData() {
  console.log('🔧 Fixing demo user data associations...\n');
  
  try {
    // 1. Get demo user ID from auth.users
    console.log('📋 Looking for demo user in auth.users...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const demoAuthUser = authUsers.users.find(u => u.email === 'demo@example.com');
    
    if (!demoAuthUser) {
      console.error('❌ Demo user not found in auth.users!');
      console.log('\n📝 To create the demo user:');
      console.log('   1. Go to Supabase Dashboard > Authentication > Users');
      console.log('   2. Click "Add user" → "Create new user"');
      console.log('   3. Email: demo@example.com');
      console.log('   4. Password: demo123');
      console.log('   5. Auto Confirm Email: ✓ (CHECK THIS!)');
      return;
    }
    
    const demoUserId = demoAuthUser.id;
    console.log('✅ Found demo auth user:', demoUserId);

    // 2. Check if organization exists
    console.log('\n📋 Checking organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    if (orgError || !org) {
      console.error('❌ Demo organization not found!');
      console.log('📝 Run the seed-data.sql file in Supabase SQL editor first.');
      return;
    }
    
    console.log('✅ Found organization:', org.name);

    // 3. Create or update demo user in public.users
    console.log('\n📋 Creating/updating demo user in public.users...');
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: demoUserId,
        email: 'demo@example.com',
        full_name: 'Alex Rivera',
        organization_id: '00000000-0000-0000-0000-000000000001',
        role: 'admin',
        phone: '+1 (555) 123-4567',
        settings: { notifications: true, theme: 'light' }
      }, { onConflict: 'id' });
    
    if (upsertError) {
      console.error('❌ Error upserting public user:', upsertError);
      return;
    }
    
    console.log('✅ Demo user updated in public.users');

    // 4. Create user-organization link
    console.log('\n📋 Creating user-organization link...');
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .upsert({
        user_id: demoUserId,
        organization_id: '00000000-0000-0000-0000-000000000001',
        role: 'admin',
        is_primary: true
      }, { onConflict: 'user_id,organization_id' });
    
    if (userOrgError) {
      console.error('❌ Error creating user-org link:', userOrgError);
      return;
    }
    
    console.log('✅ User-organization link created');

    // 5. Check if demo data exists
    console.log('\n📊 Checking demo data status...');
    
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    const { count: campaignCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    const { count: groupCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    console.log(`   - Contacts: ${contactCount || 0}`);
    console.log(`   - Campaigns: ${campaignCount || 0}`);
    console.log(`   - Events: ${eventCount || 0}`);
    console.log(`   - Groups: ${groupCount || 0}`);
    
    if (contactCount === 0) {
      console.log('\n⚠️  No demo data found!');
      console.log('\n📝 To load the enhanced demo data:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Copy ALL contents of supabase/seed-data.sql');
      console.log('   3. Paste and run the query');
      console.log('\n   This will create:');
      console.log('   - 500+ diverse contacts');
      console.log('   - 8 active campaigns');
      console.log('   - 10+ events');
      console.log('   - 7 groups with members');
      console.log('   - Thousands of activities');
    } else {
      // 6. Update created_by fields to demo user
      console.log('\n📝 Updating created_by fields to demo user...');
      
      // Update contacts
      if (contactCount > 0) {
        const { error: contactUpdateError } = await supabase
          .from('contacts')
          .update({ created_by: demoUserId })
          .eq('organization_id', '00000000-0000-0000-0000-000000000001')
          .is('created_by', null);
        
        if (!contactUpdateError) {
          console.log('✅ Updated contacts created_by');
        }
      }
      
      // Update campaigns
      if (campaignCount > 0) {
        const { error: campaignUpdateError } = await supabase
          .from('campaigns')
          .update({ created_by: demoUserId })
          .eq('organization_id', '00000000-0000-0000-0000-000000000001')
          .is('created_by', null);
        
        if (!campaignUpdateError) {
          console.log('✅ Updated campaigns created_by');
        }
      }
      
      // Update events
      if (eventCount > 0) {
        const { error: eventUpdateError } = await supabase
          .from('events')
          .update({ created_by: demoUserId })
          .eq('organization_id', '00000000-0000-0000-0000-000000000001')
          .is('created_by', null);
        
        if (!eventUpdateError) {
          console.log('✅ Updated events created_by');
        }
      }
      
      // Update groups
      if (groupCount > 0) {
        const { error: groupUpdateError } = await supabase
          .from('groups')
          .update({ created_by: demoUserId })
          .eq('organization_id', '00000000-0000-0000-0000-000000000001')
          .is('created_by', null);
        
        if (!groupUpdateError) {
          console.log('✅ Updated groups created_by');
        }
      }
      
      console.log('\n🎉 Demo data is properly linked to demo user!');
      console.log('\n📧 Login with: demo@example.com / demo123');
      console.log('🌐 Visit: http://localhost:5173/');
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the fix
fixDemoUserData();