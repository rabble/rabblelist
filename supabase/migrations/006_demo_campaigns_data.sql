-- Demo Campaigns Data Migration
-- This migration adds realistic campaign data for the demo user account

-- First, let's get the demo organization ID
DO $$
DECLARE
  v_org_id UUID;
  v_demo_user_id UUID;
  v_campaign_ids UUID[];
  v_contact_ids UUID[];
  v_event_id UUID;
BEGIN
  -- Get demo organization and user
  SELECT o.id INTO v_org_id 
  FROM organizations o 
  WHERE o.name = 'Demo Organization';
  
  SELECT u.id INTO v_demo_user_id
  FROM users u
  WHERE u.email = 'demo@example.com';

  -- Get some existing contacts for participants
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
    campaign_id, contact_id, petition_text, comment, is_public, signed_at
  )
  SELECT 
    v_campaign_ids[1],
    v_contact_ids[i],
    'I support 100% renewable energy by 2030',
    CASE 
      WHEN i % 5 = 0 THEN 'This is crucial for our children''s future!'
      WHEN i % 7 = 0 THEN 'We need climate action NOW!'
      WHEN i % 3 = 0 THEN 'Proud to support this initiative'
      ELSE NULL
    END,
    i % 3 != 0, -- 2/3 are public
    NOW() - (random() * INTERVAL '45 days')
  FROM generate_series(1, 35) i
  WHERE i <= array_length(v_contact_ids, 1);

  -- 2. Community Town Hall Event Campaign
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Community Town Hall: Housing Justice Forum',
    'event',
    'active',
    'Join us for a critical discussion on affordable housing, tenant rights, and our campaign for rent control. Hear from affected residents and policy experts.',
    200,
    147,
    NOW() - INTERVAL '20 days',
    NOW() + INTERVAL '10 days',
    jsonb_build_object(
      'event_date', (NOW() + INTERVAL '10 days')::date,
      'event_time', '18:30',
      'location', 'Community Center, 123 Main St',
      'capacity', 200,
      'rsvp_required', true,
      'reminder_days', ARRAY[7, 1],
      'tags', ARRAY['housing', 'tenant-rights', 'community']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_ids[2];

  -- Create the associated event
  INSERT INTO events (
    organization_id, name, description, location, 
    start_time, end_time, capacity, settings
  ) VALUES (
    v_org_id,
    'Community Town Hall: Housing Justice Forum',
    'Join us for a critical discussion on affordable housing, tenant rights, and our campaign for rent control.',
    'Community Center, 123 Main St',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days' + INTERVAL '2 hours',
    200,
    jsonb_build_object('campaign_id', v_campaign_ids[2])
  ) RETURNING id INTO v_event_id;

  -- Add event registrations
  INSERT INTO event_participants (
    event_id, contact_id, status, notes
  )
  SELECT 
    v_event_id,
    v_contact_ids[i],
    CASE 
      WHEN i <= 30 THEN 'registered'
      WHEN i <= 35 THEN 'attended'
      ELSE 'registered'
    END,
    CASE 
      WHEN i % 10 = 0 THEN 'Bringing 2 friends'
      WHEN i % 15 = 0 THEN 'Needs childcare'
      ELSE NULL
    END
  FROM generate_series(1, 40) i
  WHERE i <= array_length(v_contact_ids, 1);

  -- 3. Phone Banking Campaign
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
  ) RETURNING id INTO v_campaign_ids[3];

  -- Add phone bank calls
  INSERT INTO campaign_activities (
    campaign_id, contact_id, activity_type, outcome, notes, created_by, created_at
  )
  SELECT 
    v_campaign_ids[3],
    v_contact_ids[(i % array_length(v_contact_ids, 1)) + 1],
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
  FROM generate_series(1, 145) i;

  -- 4. Email Campaign
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
  ) RETURNING id INTO v_campaign_ids[4];

  -- Add email statistics
  INSERT INTO campaign_stats (
    campaign_id, stat_type, value, recorded_at
  )
  SELECT 
    v_campaign_ids[4],
    stat_type,
    value,
    NOW() - INTERVAL '30 days'
  FROM (VALUES 
    ('emails_sent', 12453),
    ('emails_opened', 8378),
    ('emails_clicked', 2963),
    ('emails_bounced', 187),
    ('emails_unsubscribed', 34)
  ) AS stats(stat_type, value);

  -- 5. SMS Campaign
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
  ) RETURNING id INTO v_campaign_ids[5];

  -- 6. Fundraising Campaign
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
  ) RETURNING id INTO v_campaign_ids[6];

  -- Add donations
  INSERT INTO donations (
    campaign_id, contact_id, amount, is_recurring, 
    payment_method, donated_at, notes
  )
  SELECT 
    v_campaign_ids[6],
    v_contact_ids[(i % array_length(v_contact_ids, 1)) + 1],
    CASE (i % 10)
      WHEN 0 THEN 250
      WHEN 1 THEN 100
      WHEN 2 THEN 50
      WHEN 3 THEN 25
      WHEN 4 THEN 100
      WHEN 5 THEN 500
      WHEN 6 THEN 25
      WHEN 7 THEN 50
      WHEN 8 THEN 1000
      ELSE 50
    END,
    i % 4 = 0, -- 25% recurring
    CASE (i % 3)
      WHEN 0 THEN 'card'
      WHEN 1 THEN 'bank'
      ELSE 'paypal'
    END,
    NOW() - (random() * INTERVAL '30 days'),
    CASE 
      WHEN i % 20 = 0 THEN 'In honor of Maria Rodriguez'
      WHEN i % 15 = 0 THEN 'Keep fighting!'
      ELSE NULL
    END
  FROM generate_series(1, 155) i;

  -- 7. Canvassing Campaign
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
  ) RETURNING id INTO v_campaign_ids[7];

  -- Add canvassing results
  INSERT INTO campaign_activities (
    campaign_id, contact_id, activity_type, outcome, notes, metadata, created_by, created_at
  )
  SELECT 
    v_campaign_ids[7],
    v_contact_ids[(i % array_length(v_contact_ids, 1)) + 1],
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
  FROM generate_series(1, 200) i;

  -- 8. Social Media Campaign
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
  ) RETURNING id INTO v_campaign_ids[8];

  -- Update campaign participant counts
  UPDATE campaigns c
  SET settings = c.settings || jsonb_build_object(
    'total_participants', (
      SELECT COUNT(DISTINCT contact_id) 
      FROM campaign_activities 
      WHERE campaign_id = c.id
    ),
    'last_activity', (
      SELECT MAX(created_at) 
      FROM campaign_activities 
      WHERE campaign_id = c.id
    )
  )
  WHERE c.id = ANY(v_campaign_ids);

  -- Add some campaign updates/milestones
  INSERT INTO campaign_updates (
    campaign_id, title, content, is_public, created_by, created_at
  ) VALUES
  (v_campaign_ids[1], 
   'Breaking: City Council Member Endorses!', 
   'Huge news! Council Member Patricia Chen just endorsed our renewable energy petition. Momentum is building!',
   true, v_demo_user_id, NOW() - INTERVAL '5 days'),
  (v_campaign_ids[1], 
   'Milestone: 3,000 signatures!', 
   'We just hit 3,000 signatures! Only 2,000 more to reach our goal. Keep sharing!',
   true, v_demo_user_id, NOW() - INTERVAL '10 days'),
  (v_campaign_ids[2], 
   'RSVP Update: Nearly at capacity!', 
   'The town hall is filling up fast! We''re at 147 RSVPs with room for 53 more. Invite your neighbors!',
   true, v_demo_user_id, NOW() - INTERVAL '2 days'),
  (v_campaign_ids[3], 
   'Phone Bank Success!', 
   'Amazing work team! We''ve identified 800+ supporters for the school funding measure. Final push this weekend!',
   false, v_demo_user_id, NOW() - INTERVAL '3 days'),
  (v_campaign_ids[6], 
   'Fundraising Update: 77% to goal!', 
   'Thanks to all our donors, we''re at $38,750 raised! Help us reach $50k by month''s end.',
   true, v_demo_user_id, NOW() - INTERVAL '1 day');

END $$;