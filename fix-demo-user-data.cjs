#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoUserAndData() {
  console.log('🚀 Creating demo user and linking all data...');
  
  try {
    // 1. Create demo user in auth.users
    console.log('📄 Creating demo user in auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@example.com',
      password: 'demo123',
      email_confirm: true
    });
    
    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }
    
    const demoUserId = authUser?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'demo@example.com')?.id;
    console.log('✅ Demo user created/found:', demoUserId);

    // 2. Create demo user in public.users table
    console.log('📄 Creating demo user in public.users...');
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .upsert([{
        id: demoUserId,
        email: 'demo@example.com',
        full_name: 'Demo User',
        organization_id: '00000000-0000-0000-0000-000000000001',
        role: 'admin'
      }])
      .select();
    
    if (publicUserError) throw publicUserError;
    console.log('✅ Public user record created');

    // 3. Create user_organization link
    console.log('📄 Creating user-organization link...');
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .upsert([{
        user_id: demoUserId,
        organization_id: '00000000-0000-0000-0000-000000000001',
        role: 'admin',
        is_primary: true
      }])
      .select();
    
    if (userOrgError) throw userOrgError;
    console.log('✅ User-organization link created');

    // 4. Update all existing data to be created_by demo user
    console.log('📄 Linking existing contacts to demo user...');
    const { error: contactsUpdateError } = await supabase
      .from('contacts')
      .update({ created_by: demoUserId })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    if (contactsUpdateError) throw contactsUpdateError;

    console.log('📄 Linking existing groups to demo user...');
    const { error: groupsUpdateError } = await supabase
      .from('groups')
      .update({ created_by: demoUserId })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    if (groupsUpdateError) throw groupsUpdateError;

    console.log('📄 Linking existing events to demo user...');
    const { error: eventsUpdateError } = await supabase
      .from('events')
      .update({ created_by: demoUserId })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    if (eventsUpdateError) throw eventsUpdateError;

    console.log('📄 Linking existing campaigns to demo user...');
    const { error: campaignsUpdateError } = await supabase
      .from('campaigns')
      .update({ created_by: demoUserId })
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');
    
    if (campaignsUpdateError) throw campaignsUpdateError;

    // 5. Add group memberships
    console.log('📄 Adding contacts to groups...');
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');

    const { data: groups } = await supabase
      .from('groups')
      .select('id, name')
      .eq('organization_id', '00000000-0000-0000-0000-000000000001');

    if (contacts && groups && contacts.length > 0 && groups.length > 0) {
      // Add first contact to Core Volunteers
      const coreVolunteersGroup = groups.find(g => g.name === 'Core Volunteers');
      if (coreVolunteersGroup) {
        await supabase
          .from('group_members')
          .upsert([{
            group_id: coreVolunteersGroup.id,
            contact_id: contacts[0].id,
            organization_id: '00000000-0000-0000-0000-000000000001',
            added_by: demoUserId
          }]);
      }

      // Add second contact to Phone Bank Team
      const phoneBankGroup = groups.find(g => g.name === 'Phone Bank Team');
      if (phoneBankGroup && contacts[1]) {
        await supabase
          .from('group_members')
          .upsert([{
            group_id: phoneBankGroup.id,
            contact_id: contacts[1].id,
            organization_id: '00000000-0000-0000-0000-000000000001',
            added_by: demoUserId
          }]);
      }
    }

    // 6. Update group member counts
    console.log('📄 Updating group member counts...');
    for (const group of groups || []) {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      await supabase
        .from('groups')
        .update({ member_count: count || 0 })
        .eq('id', group.id);
    }

    console.log('\n🎉 Demo user and data setup completed successfully!');
    console.log('📧 Demo login: demo@example.com');
    console.log('🔑 Demo password: demo123');
    console.log('✨ You can now login and see all the demo data!');
    
  } catch (error) {
    console.error('❌ Error setting up demo user:', error.message);
    console.error('Details:', error);
  }
}

createDemoUserAndData();