-- Comprehensive demo data for the demo user account
-- This migration adds realistic data to showcase all features

-- First, let's get the demo user's ID and organization
DO $$
DECLARE
  demo_user_id UUID;
  demo_org_id UUID;
  contact_id UUID;
  event_id UUID;
  group_id UUID;
  campaign_id UUID;
  pathway_id UUID;
BEGIN
  -- Get demo user and org IDs
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';
  SELECT id INTO demo_org_id FROM organizations WHERE name = 'Demo Organization';
  
  -- Only proceed if demo user exists
  IF demo_user_id IS NOT NULL AND demo_org_id IS NOT NULL THEN
    
    -- =========================================
    -- CONTACTS - Add diverse set of contacts
    -- =========================================
    
    -- Community Leaders
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'Maria Rodriguez', 'maria.rodriguez@email.com', '+1234567001', 'active', 
     ARRAY['community-leader', 'volunteer', 'high-engagement'], 
     '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}',
     'Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'James Chen', 'james.chen@email.com', '+1234567002', 'active',
     ARRAY['volunteer', 'event-organizer', 'youth-leader'],
     '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}',
     'Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Sarah Thompson', 'sarah.t@email.com', '+1234567003', 'active',
     ARRAY['donor', 'board-member', 'high-value'],
     '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}',
     'Board member and major donor. Works in tech sector. Interested in education reform.',
     demo_user_id, demo_user_id);
    
    -- Active Volunteers
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'David Kim', 'dkim@email.com', '+1234567004', 'active',
     ARRAY['volunteer', 'canvasser', 'phone-banker'],
     '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}',
     'Reliable weekend volunteer. Bilingual - helps with Korean community outreach.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Lisa Johnson', 'lisa.j@email.com', '+1234567005', 'active',
     ARRAY['volunteer', 'event-support', 'social-media'],
     '{"skills": ["photography", "writing"], "district": "Downtown"}',
     'Helps with event photography and social media posts. Former journalist.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Robert Williams', 'rwilliams@email.com', '+1234567006', 'active',
     ARRAY['volunteer', 'driver', 'setup-crew'],
     '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}',
     'Has a van - helps transport supplies and people to events. Very dependable.',
     demo_user_id, demo_user_id);
    
    -- Prospects and Leads
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'Emily Brown', 'emily.brown@email.com', '+1234567007', 'active',
     ARRAY['prospect', 'interested', 'parent'],
     '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}',
     'Met at PTA meeting. Interested in education advocacy. Has two kids in public school.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Michael Davis', 'mdavis@email.com', '+1234567008', 'active',
     ARRAY['lead', 'union-member', 'warm-lead'],
     '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}',
     'Teacher at Lincoln High. Expressed interest in organizing fellow teachers.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Angela White', 'angela.w@email.com', '+1234567009', 'active',
     ARRAY['prospect', 'small-business', 'community-supporter'],
     '{"business": "White\'s Bakery", "interests": ["local-economy"], "district": "Northside"}',
     'Owns local bakery. Supports community events. Potential sponsor.',
     demo_user_id, demo_user_id);
    
    -- Past Supporters (Re-engagement targets)
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'Patricia Martinez', 'pmartinez@email.com', '+1234567010', 'inactive',
     ARRAY['past-volunteer', 'donor', 'reactivation-target'],
     '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}',
     'Former active volunteer. Moved but still in area. Worth re-engaging.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Thomas Anderson', 'tanderson@email.com', '+1234567011', 'inactive',
     ARRAY['past-supporter', 'voter', 'low-engagement'],
     '{"voted": "2020, 2022", "district": "Southside"}',
     'Signed petitions in the past. Needs follow-up to reactivate.',
     demo_user_id, demo_user_id);
    
    -- New Sign-ups (Recent additions)
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'Jennifer Lee', 'jlee@email.com', '+1234567012', 'active',
     ARRAY['new-signup', 'interested', 'student'],
     '{"source": "campus-event", "university": "State College", "graduation": "2025", "district": "Downtown"}',
     'College student. Signed up at campus voter registration drive.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Carlos Gonzalez', 'carlos.g@email.com', '+1234567013', 'active',
     ARRAY['new-signup', 'interested', 'worker'],
     '{"source": "rally", "interests": ["workers-rights", "healthcare"], "district": "Eastside"}',
     'Met at minimum wage rally. Works in restaurant industry.',
     demo_user_id, demo_user_id);
    
    -- Key Stakeholders
    INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
    (demo_org_id, 'Dr. Patricia Edwards', 'dr.edwards@email.com', '+1234567014', 'active',
     ARRAY['stakeholder', 'expert', 'speaker'],
     '{"expertise": "public-health", "title": "Public Health Director", "district": "Citywide"}',
     'Public health expert. Available for speaking at events. Supports health equity initiatives.',
     demo_user_id, demo_user_id),
    
    (demo_org_id, 'Rev. Michael Washington', 'rev.washington@email.com', '+1234567015', 'active',
     ARRAY['stakeholder', 'faith-leader', 'community-partner'],
     '{"organization": "First Baptist Church", "congregation_size": "500", "district": "Southside"}',
     'Pastor of large congregation. Key partner for community events.',
     demo_user_id, demo_user_id);
    
    -- =========================================
    -- GROUPS - Organize contacts into groups
    -- =========================================
    
    INSERT INTO groups (organization_id, name, description, member_count, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Core Volunteers', 'Our most active and reliable volunteers', 0, 
     ARRAY['active', 'volunteers'], demo_user_id, demo_user_id)
    RETURNING id INTO group_id;
    
    -- Add members to Core Volunteers group
    INSERT INTO group_members (group_id, contact_id, role, joined_at, added_by)
    SELECT group_id, id, 'member', NOW(), demo_user_id
    FROM contacts 
    WHERE organization_id = demo_org_id 
    AND tags && ARRAY['volunteer']
    LIMIT 5;
    
    INSERT INTO groups (organization_id, name, description, member_count, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Major Donors', 'Donors who have contributed over $1000', 0,
     ARRAY['donors', 'high-value'], demo_user_id, demo_user_id),
    
    (demo_org_id, 'Youth Leaders', 'Young organizers and student activists', 0,
     ARRAY['youth', 'students'], demo_user_id, demo_user_id),
    
    (demo_org_id, 'Faith Communities', 'Religious leaders and faith-based partners', 0,
     ARRAY['faith', 'community-partners'], demo_user_id, demo_user_id);
    
    -- =========================================
    -- EVENTS - Create various types of events
    -- =========================================
    
    -- Upcoming Rally
    INSERT INTO events (organization_id, name, description, start_time, end_time, location, 
                       capacity, event_type, status, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Community Justice Rally', 
     'Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.',
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
     '{"venue": "City Hall Plaza", "address": "123 Main St", "city": "Downtown", "instructions": "Meet at the main steps"}',
     500, 'rally', 'scheduled', ARRAY['rally', 'justice', 'community'],
     demo_user_id, demo_user_id)
    RETURNING id INTO event_id;
    
    -- Add attendees to the rally
    INSERT INTO event_attendees (event_id, contact_id, status, registered_at, registered_by)
    SELECT event_id, id, 
           CASE WHEN RANDOM() < 0.7 THEN 'confirmed' ELSE 'registered' END,
           NOW() - INTERVAL '1-5 days' * RANDOM(),
           demo_user_id
    FROM contacts 
    WHERE organization_id = demo_org_id 
    AND status = 'active'
    LIMIT 8;
    
    -- Volunteer Training
    INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                       capacity, event_type, status, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'New Volunteer Orientation', 
     'Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.',
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours',
     '{"venue": "Community Center", "address": "456 Oak Ave", "room": "Conference Room A"}',
     30, 'training', 'scheduled', ARRAY['training', 'volunteers', 'orientation'],
     demo_user_id, demo_user_id);
    
    -- Phone Banking Session
    INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                       capacity, event_type, status, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Phone Bank for Change', 
     'Join us for phone banking! We\'ll be calling supporters to mobilize for upcoming actions.',
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
     '{"venue": "Campaign HQ", "address": "789 Elm St", "parking": "Free parking in rear"}',
     20, 'phone_bank', 'scheduled', ARRAY['phone-bank', 'outreach', 'volunteers'],
     demo_user_id, demo_user_id);
    
    -- Community Meeting
    INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                       capacity, event_type, status, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Town Hall: Education Funding', 
     'Community discussion on the state of education funding. Hear from teachers, parents, and students.',
     NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '2 hours',
     '{"venue": "Lincoln High School", "address": "321 School St", "room": "Auditorium"}',
     200, 'meeting', 'scheduled', ARRAY['town-hall', 'education', 'community'],
     demo_user_id, demo_user_id);
    
    -- Past Event
    INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                       capacity, event_type, status, tags, notes, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Voter Registration Drive', 
     'Successful voter registration drive in the downtown area.',
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '4 hours',
     '{"venue": "Downtown Park", "address": "100 Park Ave"}',
     100, 'canvass', 'completed', ARRAY['voter-reg', 'outreach', 'success'],
     'Great turnout! Registered 47 new voters. Maria Rodriguez brought 5 volunteers.',
     demo_user_id, demo_user_id);
    
    -- =========================================
    -- CALL HISTORY - Add call records
    -- =========================================
    
    -- Get some contact IDs to add call history
    FOR contact_id IN 
      SELECT id FROM contacts 
      WHERE organization_id = demo_org_id 
      LIMIT 10
    LOOP
      -- Add 1-3 calls per contact
      FOR i IN 1..FLOOR(RANDOM() * 3 + 1) LOOP
        INSERT INTO calls (
          organization_id, contact_id, direction, duration, status,
          outcome, notes, scheduled_at, started_at, ended_at,
          caller_id, created_by, updated_by
        ) VALUES (
          demo_org_id, contact_id, 
          CASE WHEN RANDOM() < 0.8 THEN 'outbound' ELSE 'inbound' END,
          FLOOR(RANDOM() * 600 + 30), -- 30 seconds to 10 minutes
          'completed',
          CASE 
            WHEN RANDOM() < 0.3 THEN 'voicemail'
            WHEN RANDOM() < 0.6 THEN 'answered'
            WHEN RANDOM() < 0.8 THEN 'busy'
            ELSE 'no_answer'
          END,
          CASE 
            WHEN RANDOM() < 0.5 THEN 'Left voicemail about upcoming rally'
            WHEN RANDOM() < 0.7 THEN 'Spoke with contact - confirmed attendance'
            ELSE 'No answer - try again later'
          END,
          NOW() - INTERVAL '1-30 days' * RANDOM(),
          NOW() - INTERVAL '1-30 days' * RANDOM(),
          NOW() - INTERVAL '1-30 days' * RANDOM() + INTERVAL '5 minutes',
          demo_user_id, demo_user_id, demo_user_id
        );
      END LOOP;
    END LOOP;
    
    -- =========================================
    -- CAMPAIGNS - Create organizing campaigns
    -- =========================================
    
    INSERT INTO campaigns (organization_id, name, description, status, start_date, end_date,
                          goals, metrics, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Justice for All 2024', 
     'Our major campaign for criminal justice reform. Focus on bail reform and police accountability.',
     'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days',
     '{"contacts_goal": 1000, "events_goal": 10, "volunteers_goal": 50}',
     '{"contacts_reached": 245, "events_held": 3, "volunteers_active": 22}',
     ARRAY['justice', 'reform', '2024'], demo_user_id, demo_user_id)
    RETURNING id INTO campaign_id;
    
    INSERT INTO campaigns (organization_id, name, description, status, start_date, end_date,
                          goals, metrics, tags, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Get Out The Vote', 
     'Mobilizing voters for the upcoming election. Focus on historically low-turnout neighborhoods.',
     'planning', NOW() + INTERVAL '30 days', NOW() + INTERVAL '120 days',
     '{"voters_registered": 500, "pledge_cards": 1000}', '{}',
     ARRAY['gotv', 'voting', 'elections'], demo_user_id, demo_user_id);
    
    -- =========================================
    -- PATHWAYS - Create engagement pathways
    -- =========================================
    
    INSERT INTO pathways (organization_id, name, description, steps, default_pathway,
                         trigger_conditions, created_by, updated_by)
    VALUES 
    (demo_org_id, 'New Volunteer Journey', 
     'Onboarding pathway for new volunteers to get them engaged and active',
     '[
       {"order": 1, "name": "Welcome Email", "type": "email", "delay_days": 0},
       {"order": 2, "name": "Orientation Invite", "type": "email", "delay_days": 3},
       {"order": 3, "name": "First Action", "type": "task", "delay_days": 7},
       {"order": 4, "name": "Check-in Call", "type": "call", "delay_days": 14},
       {"order": 5, "name": "Leadership Opportunity", "type": "email", "delay_days": 30}
     ]',
     false, '{"tags": ["new-signup", "volunteer"]}',
     demo_user_id, demo_user_id)
    RETURNING id INTO pathway_id;
    
    INSERT INTO pathways (organization_id, name, description, steps, default_pathway,
                         trigger_conditions, created_by, updated_by)
    VALUES 
    (demo_org_id, 'Donor Cultivation', 
     'Pathway to cultivate and upgrade donors',
     '[
       {"order": 1, "name": "Thank You Call", "type": "call", "delay_days": 1},
       {"order": 2, "name": "Impact Report", "type": "email", "delay_days": 30},
       {"order": 3, "name": "Event Invitation", "type": "email", "delay_days": 45},
       {"order": 4, "name": "Upgrade Ask", "type": "call", "delay_days": 90}
     ]',
     false, '{"tags": ["donor"]}',
     demo_user_id, demo_user_id);
    
    -- =========================================
    -- ENGAGEMENT RECORDS - Track interactions
    -- =========================================
    
    -- Add some engagement records for active contacts
    FOR contact_id IN 
      SELECT id FROM contacts 
      WHERE organization_id = demo_org_id 
      AND status = 'active'
      LIMIT 15
    LOOP
      INSERT INTO engagement_records (
        organization_id, contact_id, activity_type, 
        activity_date, notes, created_by
      ) VALUES 
      (demo_org_id, contact_id, 'email_sent',
       NOW() - INTERVAL '5 days', 'Sent rally invitation', demo_user_id),
      
      (demo_org_id, contact_id, 'event_attended',
       NOW() - INTERVAL '20 days', 'Attended volunteer training', demo_user_id);
    END LOOP;
    
    -- =========================================
    -- TAGS - Add some predefined tags
    -- =========================================
    
    INSERT INTO tags (organization_id, name, category, color, description, created_by)
    VALUES 
    (demo_org_id, 'high-priority', 'engagement', '#FF0000', 'Contacts needing immediate attention', demo_user_id),
    (demo_org_id, 'monthly-donor', 'donor', '#00AA00', 'Recurring monthly donors', demo_user_id),
    (demo_org_id, 'spanish-speaker', 'language', '#0066CC', 'Spanish speaking contacts', demo_user_id),
    (demo_org_id, 'board-member', 'leadership', '#660099', 'Board members and advisors', demo_user_id),
    (demo_org_id, '2024-campaign', 'campaign', '#FF6600', 'Involved in 2024 campaign', demo_user_id)
    ON CONFLICT (organization_id, name) DO NOTHING;
    
    -- Update counts
    UPDATE groups g
    SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)
    WHERE organization_id = demo_org_id;
    
    UPDATE events e  
    SET current_attendees = (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)
    WHERE organization_id = demo_org_id;
    
  END IF;
END $$;