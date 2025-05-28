-- CONTACT MANAGER PWA - SEED DATA
-- This file contains demo data for testing and development
-- Prerequisites: 
-- 1. Run schema.sql first to create the database structure
-- 2. Create demo@example.com user in Supabase Auth dashboard

-- CREATE DEFAULT ORGANIZATION
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Organization',
    'US',
    '{"timezone": "America/New_York", "calling_hours": {"start": "09:00", "end": "20:00"}}',
    '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true, "campaigns": true, "automation": true, "api_access": true}'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings,
    features = EXCLUDED.features,
    updated_at = NOW();

-- SETUP DEMO USER
-- Get the existing demo user ID and use it for all references
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get existing demo user ID
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';
    
    -- If no demo user exists, this setup requires one to be created manually
    -- through Supabase Auth dashboard first
    IF demo_user_id IS NOT NULL THEN
        -- Create or update demo user in public.users
        INSERT INTO users (id, email, full_name, organization_id, role)
        VALUES (
            demo_user_id,
            'demo@example.com',
            'Demo User',
            '00000000-0000-0000-0000-000000000001',
            'admin'
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            organization_id = EXCLUDED.organization_id,
            role = EXCLUDED.role,
            updated_at = NOW();

        -- Add demo user to user_organizations
        INSERT INTO user_organizations (user_id, organization_id, role, is_primary)
        VALUES (
            demo_user_id,
            '00000000-0000-0000-0000-000000000001',
            'admin',
            true
        )
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
            role = EXCLUDED.role,
            is_primary = EXCLUDED.is_primary;
    END IF;
END $$;

-- CONTACTS (ACTIVISTS AND SUPPORTERS)
-- Clear existing demo contacts to avoid conflicts
DELETE FROM contact_interactions WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM event_registrations WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM group_members WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Insert activist/organizer contacts
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, source, engagement_score, created_by)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Maria Rodriguez', 'maria.rodriguez@example.com', '+1234567001', 'active', ARRAY['community-leader', 'volunteer', 'high-engagement'], '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}'::jsonb, 'manual', 95, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'James Chen', 'james.chen@example.com', '+1234567002', 'active', ARRAY['volunteer', 'event-organizer', 'youth-leader'], '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}'::jsonb, 'manual', 88, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Sarah Thompson', 'sarah.t@example.com', '+1234567003', 'active', ARRAY['donor', 'board-member', 'high-value'], '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}'::jsonb, 'manual', 92, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'David Kim', 'dkim@example.com', '+1234567004', 'active', ARRAY['volunteer', 'canvasser', 'phone-banker'], '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}'::jsonb, 'import', 75, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Lisa Johnson', 'lisa.j@example.com', '+1234567005', 'active', ARRAY['volunteer', 'event-support', 'social-media'], '{"skills": ["photography", "writing"], "district": "Downtown"}'::jsonb, 'manual', 82, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Robert Williams', 'rwilliams@example.com', '+1234567006', 'active', ARRAY['volunteer', 'driver', 'setup-crew'], '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}'::jsonb, 'manual', 70, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Emily Brown', 'emily.brown@example.com', '+1234567007', 'active', ARRAY['prospect', 'interested', 'parent'], '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}'::jsonb, 'api', 65, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Michael Davis', 'mdavis@example.com', '+1234567008', 'active', ARRAY['lead', 'union-member', 'warm-lead'], '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}'::jsonb, 'import', 78, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Angela White', 'angela.w@example.com', '+1234567009', 'active', ARRAY['prospect', 'small-business', 'community-supporter'], '{"business": "Whites Bakery", "interests": ["local-economy"], "district": "Northside"}'::jsonb, 'manual', 60, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Patricia Martinez', 'pmartinez@example.com', '+1234567010', 'inactive', ARRAY['past-volunteer', 'donor', 'reactivation-target'], '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}'::jsonb, 'import', 45, (SELECT id FROM users WHERE email = 'demo@example.com'));

-- GROUPS
DELETE FROM groups WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO groups (organization_id, name, description, settings, tags, is_active, group_type, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Core Volunteers', 'Our most active and reliable volunteers', '{"meeting_schedule": "weekly", "communication": "slack"}'::jsonb, ARRAY['volunteers', 'core'], true, 'volunteer_team', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Phone Bank Team', 'Volunteers who make calls for campaigns', '{"training_required": true, "tools": ["dialer", "scripts"]}'::jsonb, ARRAY['phone-bank', 'outreach'], true, 'action_team', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Major Donors', 'Supporters who have donated over $1000', '{"benefits": ["quarterly-briefings", "exclusive-events"]}'::jsonb, ARRAY['donors', 'vip'], true, 'donor_circle', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add group members
INSERT INTO group_members (group_id, contact_id, organization_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Core Volunteers' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid),
  id,
  organization_id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND tags && ARRAY['volunteer']
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, contact_id, organization_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Phone Bank Team' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid),
  id,
  organization_id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND tags && ARRAY['phone-banker']
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, contact_id, organization_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Major Donors' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid),
  id,
  organization_id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND tags && ARRAY['donor']
ON CONFLICT DO NOTHING;

-- Update group member counts
UPDATE groups SET member_count = (
  SELECT COUNT(*) FROM group_members WHERE group_id = groups.id
);

-- EVENTS
DELETE FROM event_registrations WHERE event_id IN (SELECT id FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO events (organization_id, name, description, start_time, event_type, location, capacity, tags, created_by, is_published, registration_required, settings) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Community Justice Rally', 'Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.', NOW() + INTERVAL '7 days', 'rally', 'City Hall Plaza, 123 Main St, Downtown', 500, ARRAY['rally', 'justice', 'community'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, true, '{"livestream": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'New Volunteer Orientation', 'Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.', NOW() + INTERVAL '3 days', 'training', 'Community Center, 456 Oak Ave, Conference Room A', 30, ARRAY['training', 'volunteers', 'orientation'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, true, '{"materials_provided": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Phone Bank for Change', 'Join us for phone banking! We will be calling supporters to mobilize for upcoming actions.', NOW() + INTERVAL '2 days', 'phone_bank', 'Campaign HQ, 789 Elm St, Free parking in rear', 20, ARRAY['phone-bank', 'outreach', 'volunteers'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, true, '{"food_provided": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Town Hall: Education Funding', 'Community discussion on the state of education funding. Hear from teachers, parents, and students.', NOW() + INTERVAL '10 days', 'meeting', 'Lincoln High School Auditorium, 321 School St', 200, ARRAY['town-hall', 'education', 'community'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, true, '{"childcare": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Voter Registration Drive', 'Help us register new voters in the downtown area!', NOW() - INTERVAL '14 days', 'canvass', 'Downtown Park, 100 Park Ave', 100, ARRAY['voter-reg', 'outreach', 'success'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, false, '{"completed": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Direct Action Training', 'Learn nonviolent direct action tactics and legal rights. Required for participation in upcoming actions.', NOW() + INTERVAL '5 days', 'training', 'Union Hall, 222 Labor Way', 50, ARRAY['training', 'direct-action', 'required'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, true, '{"mandatory": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Community Potluck & Strategy Session', 'Share a meal and plan our next campaign. Bring a dish to share!', NOW() + INTERVAL '12 days', 'meeting', 'First Baptist Church, 555 Community Blvd', 75, ARRAY['community', 'planning', 'social'], (SELECT id FROM auth.users WHERE email = 'demo@example.com'), true, false, '{"potluck": true}'::jsonb);

-- Register people for events
INSERT INTO event_registrations (event_id, contact_id, organization_id, full_name, email, phone, status)
SELECT 
  e.id,
  c.id,
  c.organization_id,
  c.full_name,
  c.email,
  c.phone,
  CASE WHEN RANDOM() < 0.7 THEN 'attended' ELSE 'registered' END
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND e.name = 'Community Justice Rally'
  AND c.tags && ARRAY['volunteer', 'community-leader']
LIMIT 8;

INSERT INTO event_registrations (event_id, contact_id, organization_id, full_name, email, phone, status)
SELECT 
  e.id,
  c.id,
  c.organization_id,
  c.full_name,
  c.email,
  c.phone,
  'registered'
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND e.name = 'New Volunteer Orientation'
  AND c.tags && ARRAY['prospect', 'interested']
LIMIT 5;

INSERT INTO event_registrations (event_id, contact_id, organization_id, full_name, email, phone, status)
SELECT 
  e.id,
  c.id,
  c.organization_id,
  c.full_name,
  c.email,
  c.phone,
  'registered'
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND e.name = 'Phone Bank for Change'
  AND c.tags && ARRAY['phone-banker']
LIMIT 4;

-- PATHWAYS (ENGAGEMENT JOURNEYS)
DELETE FROM pathway_steps WHERE pathway_id IN (SELECT id FROM pathways WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM pathways WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO pathways (organization_id, name, description, pathway_type, status, created_by) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'New Volunteer Onboarding', 'Standard pathway for onboarding new volunteers into active participation', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Prospect to Activist', 'Convert interested community members into active organizers', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Donor Cultivation', 'Build relationships with potential major donors', 'fundraising', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Leadership Development', 'Develop volunteers into campaign leaders and organizers', 'leadership', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Re-engagement Campaign', 'Win back inactive supporters and past volunteers', 'reactivation', 'active', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add pathway steps (sample for New Volunteer Onboarding)
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'Welcome Email', 'Send welcome email with mission and values', 
  'action', 'immediate', NULL, 'email', 
  '{"template": "welcome_volunteer", "subject": "Welcome to the movement!"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Orientation Invite', 'Invite to next volunteer orientation session', 
  'action', 'delay', '{"days": 2}', 'task', 
  '{"task": "Send orientation session invite", "priority": "high"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Check-in Call', 'Personal call to welcome and answer questions', 
  'action', 'delay', '{"days": 7}', 'call', 
  '{"script": "Welcome check-in", "duration": 15}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 4, 'First Action', 'Invite to easy first volunteer action', 
  'action', 'delay', '{"days": 14}', 'email', 
  '{"template": "first_action", "subject": "Ready for your first action?"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- CAMPAIGNS
DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_demo_user_id UUID;
  v_campaign_ids UUID[];
  v_contact_ids UUID[];
  v_event_id UUID;
BEGIN
  -- Get demo user and contacts
  SELECT u.id INTO v_demo_user_id FROM users u WHERE u.email = 'demo@example.com';
  
  SELECT ARRAY_AGG(id) INTO v_contact_ids
  FROM (
    SELECT id FROM contacts 
    WHERE organization_id = v_org_id 
    ORDER BY created_at 
    LIMIT 50
  ) c;

  -- 1. Climate Action Petition Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Climate Action Now: Demand 100% Renewable Energy',
    'petition',
    'active',
    'Join thousands demanding our city commit to 100% renewable energy by 2030. We need bold climate action to protect our future!',
    5000,
    3847,
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '15 days',
    jsonb_build_object(
      'target', 'Mayor Johnson and City Council',
      'petition_text', 'We, the undersigned, demand that our city commit to transitioning to 100% renewable energy by 2030...',
      'allow_comments', true,
      'featured', true,
      'tags', ARRAY['climate', 'environment', 'renewable-energy']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[1];

  -- Add petition signatures
  INSERT INTO petition_signatures (
    campaign_id, contact_id, organization_id, full_name, email, phone, comment, is_public, signed_at
  )
  SELECT 
    v_campaign_ids[1],
    v_contact_ids[i],
    v_org_id,
    'Supporter ' || i,
    'supporter' || i || '@example.com',
    '+1555000' || i,
    CASE 
      WHEN i % 5 = 0 THEN 'This is crucial for our children''s future!'
      WHEN i % 7 = 0 THEN 'We need climate action NOW!'
      WHEN i % 3 = 0 THEN 'Proud to support this initiative'
      ELSE NULL
    END,
    i % 3 != 0, -- 2/3 are public
    NOW() - (random() * INTERVAL '45 days')
  FROM generate_series(1, 10) i
  WHERE i <= array_length(v_contact_ids, 1);

  -- 2. Phone Banking Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Get Out The Vote: Special Election Phone Bank',
    'phone_bank',
    'active',
    'Help us reach voters about the critical school funding measure on the ballot. Every call makes a difference!',
    2000,
    1456,
    NOW() - INTERVAL '14 days',
    NOW() + INTERVAL '7 days',
    jsonb_build_object(
      'script_id', gen_random_uuid(),
      'call_hours', jsonb_build_object('start', '10:00', 'end', '20:00'),
      'talking_points', ARRAY[
        'School funding measure will provide $50M for repairs',
        'No tax increase - uses existing revenue',
        'Supported by teachers, parents, and community leaders'
      ],
      'tags', ARRAY['election', 'education', 'gotv']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[2];

  -- Add phone bank calls
  INSERT INTO campaign_activities (
    campaign_id, contact_id, organization_id, activity_type, outcome, notes, created_by, created_at
  )
  SELECT 
    v_campaign_ids[2],
    v_contact_ids[(i % array_length(v_contact_ids, 1)) + 1],
    v_org_id,
    'phone_call',
    CASE (i % 10)
      WHEN 0 THEN 'no_answer'
      WHEN 1 THEN 'voicemail'
      WHEN 2 THEN 'wrong_number'
      WHEN 3 THEN 'refused'
      WHEN 4 THEN 'supporter'
      WHEN 5 THEN 'supporter'
      WHEN 6 THEN 'undecided'
      WHEN 7 THEN 'supporter'
      WHEN 8 THEN 'opposed'
      ELSE 'supporter'
    END,
    CASE (i % 10)
      WHEN 4 THEN 'Strong yes - will vote early'
      WHEN 5 THEN 'Supportive, needs ride to polls'
      WHEN 6 THEN 'Wants more information about tax impact'
      WHEN 8 THEN 'Concerned about government spending'
      ELSE NULL
    END,
    v_demo_user_id,
    NOW() - (random() * INTERVAL '14 days')
  FROM generate_series(1, 20) i;

  -- 3. Email Campaign (Completed)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Action Alert: Stop the Pipeline',
    'email',
    'completed',
    'Urgent email campaign to mobilize opposition to the proposed pipeline through our community. Contact representatives now!',
    10000,
    12453,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    jsonb_build_object(
      'subject', 'URGENT: Stop the Pipeline - Action Needed Today',
      'preview_text', 'Our community needs your voice to stop this dangerous pipeline',
      'from_name', 'Rise Community Action',
      'reply_to', 'action@risecommunity.org',
      'open_rate', 67.3,
      'click_rate', 23.8,
      'tags', ARRAY['environment', 'urgent', 'pipeline']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[3];

  -- 4. SMS Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Rapid Response: Rally Alert System',
    'sms',
    'active',
    'SMS alert system for urgent actions and rallies. Keep our community ready to mobilize at a moment''s notice.',
    500,
    423,
    NOW() - INTERVAL '90 days',
    NULL, -- Ongoing
    jsonb_build_object(
      'keyword', 'RISE',
      'short_code', '555888',
      'auto_response', 'Thanks for joining RISE alerts! Reply STOP to unsubscribe.',
      'segment_size', 2,
      'tags', ARRAY['rapid-response', 'alerts', 'mobilization']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[4];

  -- 5. Fundraising Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Power to the People: 2024 Organizing Fund',
    'donation',
    'active',
    'Support grassroots organizing in our community. Every dollar goes directly to building people power for justice!',
    50000,
    38750,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    jsonb_build_object(
      'donation_levels', jsonb_build_array(
        jsonb_build_object('amount', 25, 'label', 'Supporter'),
        jsonb_build_object('amount', 50, 'label', 'Activist'),
        jsonb_build_object('amount', 100, 'label', 'Organizer'),
        jsonb_build_object('amount', 250, 'label', 'Leader'),
        jsonb_build_object('amount', 500, 'label', 'Champion')
      ),
      'recurring_enabled', true,
      'thermometer_visible', true,
      'donor_wall', true,
      'tags', ARRAY['fundraising', 'organizing', 'power-building']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[5];

  -- 6. Canvassing Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Neighborhood Power: Door-to-Door Organizing',
    'canvas',
    'active',
    'Building power block by block! Join us every weekend to talk with neighbors about local issues and grow our movement.',
    1000,
    673,
    NOW() - INTERVAL '21 days',
    NULL, -- Ongoing
    jsonb_build_object(
      'turf_cutting_enabled', true,
      'walk_lists_generated', 45,
      'canvass_days', ARRAY['Saturday', 'Sunday'],
      'meeting_location', 'RISE Office - 456 Community Ave',
      'tags', ARRAY['canvassing', 'field', 'base-building']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[6];

  -- Add canvassing results
  INSERT INTO campaign_activities (
    campaign_id, contact_id, organization_id, activity_type, outcome, notes, metadata, created_by, created_at
  )
  SELECT 
    v_campaign_ids[6],
    v_contact_ids[(i % array_length(v_contact_ids, 1)) + 1],
    v_org_id,
    'canvass',
    CASE (i % 8)
      WHEN 0 THEN 'not_home'
      WHEN 1 THEN 'refused'
      WHEN 2 THEN 'supporter'
      WHEN 3 THEN 'undecided'
      WHEN 4 THEN 'not_home'
      WHEN 5 THEN 'supporter'
      WHEN 6 THEN 'moved'
      ELSE 'supporter'
    END,
    CASE (i % 8)
      WHEN 2 THEN 'Excited about rent control campaign'
      WHEN 3 THEN 'Needs more info on our positions'
      WHEN 5 THEN 'Wants to volunteer!'
      ELSE NULL
    END,
    jsonb_build_object(
      'canvasser', 'Vol_' || (i % 10),
      'turf', 'Block_' || (i % 20),
      'attempt_number', (i % 3) + 1
    ),
    v_demo_user_id,
    NOW() - (random() * INTERVAL '21 days')
  FROM generate_series(1, 30) i;

  -- 7. Social Media Campaign (Completed)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    '#JusticeForAll Social Media Storm',
    'social',
    'completed',
    'Coordinated social media campaign to demand justice and accountability. Share your story with #JusticeForAll!',
    5000,
    7234,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '75 days',
    jsonb_build_object(
      'hashtags', ARRAY['#JusticeForAll', '#RiseTogether', '#CommunityPower'],
      'platforms', ARRAY['twitter', 'instagram', 'facebook', 'tiktok'],
      'sample_posts', jsonb_build_array(
        'We demand justice and accountability! #JusticeForAll #RiseTogether',
        'Our communities deserve better. Share your story: #JusticeForAll',
        'Together we rise! Join the movement for justice: #JusticeForAll #CommunityPower'
      ),
      'influencers_engaged', 23,
      'reach_estimate', 250000,
      'tags', ARRAY['social-media', 'digital', 'justice']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[7];

END $$;

-- CONTACT INTERACTIONS
-- Add some meaningful interactions
INSERT INTO contact_interactions (contact_id, organization_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
  c.organization_id,
  u.id,
  'note',
  NULL,
  'completed',
  NULL,
  CASE c.email
    WHEN 'maria.rodriguez@example.com' THEN 'Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.'
    WHEN 'james.chen@example.com' THEN 'Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.'
    WHEN 'sarah.t@example.com' THEN 'Board member and major donor. Works in tech sector. Interested in education reform.'
    WHEN 'david.kim@example.com' THEN 'Reliable weekend volunteer. Bilingual - helps with Korean community outreach.'
    ELSE 'Initial contact note'
  END
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND u.email = 'demo@example.com'
  AND c.email IN ('maria.rodriguez@example.com', 'james.chen@example.com', 'sarah.t@example.com', 'david.kim@example.com');

-- Add some call interactions
INSERT INTO contact_interactions (contact_id, organization_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
  c.organization_id,
  u.id,
  'call',
  'outbound',
  'completed',
  180,
  'Discussed upcoming rally. Confirmed attendance.'
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND u.email = 'demo@example.com'
  AND c.email IN ('maria.rodriguez@example.com', 'david.kim@example.com');

-- Add some email interactions
INSERT INTO contact_interactions (contact_id, organization_id, user_id, type, direction, status, notes)
SELECT 
  c.id,
  c.organization_id,
  u.id,
  'email',
  'outbound',
  'completed',
  'Sent volunteer orientation materials and schedule'
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND u.email = 'demo@example.com'
  AND c.tags && ARRAY['volunteer']
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
✅ SEED DATA LOADED SUCCESSFULLY!

Demo Account Credentials:
Email: demo@example.com
Password: demo123

Data Loaded:
- 10 activist/supporter contacts with realistic profiles
- 3 volunteer and donor groups with members
- 7 upcoming and past events with registrations
- 5 engagement pathways (volunteer onboarding, leadership development, etc.)
- 7 active and completed campaigns (petition, phone bank, email, SMS, fundraising, canvassing, social media)
- Campaign activities and outcomes
- Contact interactions and notes

The demo organization is ready for testing all features!
';
END $$;