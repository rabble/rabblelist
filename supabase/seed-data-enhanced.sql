-- CONTACT MANAGER PWA - ENHANCED SEED DATA
-- This creates a VERY active campaign with lots of realistic data
-- Prerequisites: 
-- 1. Run schema.sql first to create the database structure
-- 2. Create demo@example.com user in Supabase Auth dashboard

-- CREATE DEFAULT ORGANIZATION
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Rise Community Action',
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
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get existing demo user ID
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';
    
    IF demo_user_id IS NOT NULL THEN
        -- Create or update demo user in public.users
        INSERT INTO users (id, email, full_name, organization_id, role, phone, settings)
        VALUES (
            demo_user_id,
            'demo@example.com',
            'Alex Rivera',
            '00000000-0000-0000-0000-000000000001',
            'admin',
            '+1 (555) 123-4567',
            '{"notifications": true, "theme": "light"}'::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            organization_id = EXCLUDED.organization_id,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            settings = EXCLUDED.settings,
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

-- MASSIVE CONTACT LIST (500+ contacts representing a real grassroots movement)
-- Clear existing demo contacts
DELETE FROM campaign_activities WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM petition_signatures WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM phonebank_sessions WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM communication_logs WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM contact_interactions WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM event_registrations WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM pathway_members WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM contact_pathways WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM group_members WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Insert a diverse set of contacts
DO $$
DECLARE
    v_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_demo_user_id UUID;
    v_contact_id UUID;
    v_first_names TEXT[] := ARRAY['Maria', 'James', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'Michael', 'Angela', 'Patricia', 'John', 'Jennifer', 'William', 'Linda', 'Richard', 'Barbara', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Betty', 'Matthew', 'Helen', 'Anthony', 'Sandra', 'Mark', 'Donna', 'Donald', 'Carol', 'Steven', 'Ruth', 'Paul', 'Sharon', 'Andrew', 'Michelle', 'Joshua', 'Laura', 'Kenneth', 'Sarah', 'Kevin', 'Kimberly', 'Brian', 'Deborah', 'George', 'Dorothy'];
    v_last_names TEXT[] := ARRAY['Rodriguez', 'Chen', 'Thompson', 'Kim', 'Johnson', 'Williams', 'Brown', 'Davis', 'White', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Lee', 'Perez', 'Lopez', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz'];
    v_districts TEXT[] := ARRAY['Downtown', 'Eastside', 'Westside', 'Northside', 'Southside', 'Midtown', 'Uptown', 'Riverside', 'Lakeside', 'Harbor District'];
    v_skills TEXT[] := ARRAY['social media', 'graphic design', 'writing', 'photography', 'video editing', 'web design', 'data analysis', 'public speaking', 'event planning', 'fundraising'];
    v_interests TEXT[] := ARRAY['climate', 'education', 'healthcare', 'housing', 'labor-rights', 'immigration', 'criminal-justice', 'voting-rights', 'environment', 'economy'];
    v_i INTEGER;
    v_tag_set TEXT[];
    v_engagement_score INTEGER;
    v_status TEXT;
BEGIN
    -- Get demo user ID
    SELECT id INTO v_demo_user_id FROM users WHERE email = 'demo@example.com';

    -- Create 500 diverse contacts
    FOR v_i IN 1..500 LOOP
        -- Determine engagement level and tags
        v_engagement_score := 20 + (random() * 80)::INTEGER;
        
        -- Assign tags based on engagement score and randomness
        v_tag_set := ARRAY[]::TEXT[];
        
        -- Base tags
        IF v_engagement_score > 80 THEN
            v_tag_set := v_tag_set || ARRAY['high-engagement', 'volunteer'];
            IF random() < 0.3 THEN v_tag_set := v_tag_set || 'leader'; END IF;
            IF random() < 0.4 THEN v_tag_set := v_tag_set || 'organizer'; END IF;
        ELSIF v_engagement_score > 60 THEN
            v_tag_set := v_tag_set || ARRAY['volunteer'];
            IF random() < 0.5 THEN v_tag_set := v_tag_set || 'phone-banker'; END IF;
            IF random() < 0.3 THEN v_tag_set := v_tag_set || 'canvasser'; END IF;
        ELSIF v_engagement_score > 40 THEN
            v_tag_set := v_tag_set || ARRAY['supporter'];
            IF random() < 0.3 THEN v_tag_set := v_tag_set || 'donor'; END IF;
        ELSE
            v_tag_set := v_tag_set || ARRAY['prospect'];
        END IF;
        
        -- Add random additional tags
        IF random() < 0.2 THEN v_tag_set := v_tag_set || 'student'; END IF;
        IF random() < 0.15 THEN v_tag_set := v_tag_set || 'union-member'; END IF;
        IF random() < 0.1 THEN v_tag_set := v_tag_set || 'community-leader'; END IF;
        IF random() < 0.25 THEN v_tag_set := v_tag_set || 'event-attendee'; END IF;
        IF random() < 0.1 THEN v_tag_set := v_tag_set || 'social-media-influencer'; END IF;
        
        -- Determine status
        IF v_engagement_score < 30 AND random() < 0.2 THEN
            v_status := 'inactive';
        ELSE
            v_status := 'active';
        END IF;
        
        -- Insert contact
        INSERT INTO contacts (
            organization_id, 
            full_name, 
            email, 
            phone, 
            address,
            status, 
            tags, 
            custom_fields, 
            source, 
            engagement_score,
            notes,
            last_contact_date,
            created_by,
            created_at
        ) VALUES (
            v_org_id,
            v_first_names[1 + (random() * (array_length(v_first_names, 1) - 1))::INTEGER] || ' ' || 
            v_last_names[1 + (random() * (array_length(v_last_names, 1) - 1))::INTEGER],
            'contact' || v_i || '@example.com',
            '+1555' || lpad((1000000 + random() * 8999999)::INTEGER::TEXT, 7, '0'),
            (100 + random() * 9899)::INTEGER || ' ' || 
            CASE (random() * 10)::INTEGER
                WHEN 0 THEN 'Main'
                WHEN 1 THEN 'Oak'
                WHEN 2 THEN 'Elm'
                WHEN 3 THEN 'Park'
                WHEN 4 THEN 'First'
                WHEN 5 THEN 'Second'
                WHEN 6 THEN 'Washington'
                WHEN 7 THEN 'Lincoln'
                WHEN 8 THEN 'Liberty'
                ELSE 'Union'
            END || ' ' ||
            CASE (random() * 5)::INTEGER
                WHEN 0 THEN 'St'
                WHEN 1 THEN 'Ave'
                WHEN 2 THEN 'Blvd'
                WHEN 3 THEN 'Rd'
                ELSE 'Way'
            END || ', ' ||
            v_districts[1 + (random() * (array_length(v_districts, 1) - 1))::INTEGER],
            v_status,
            v_tag_set,
            jsonb_build_object(
                'district', v_districts[1 + (random() * (array_length(v_districts, 1) - 1))::INTEGER],
                'preferred_contact', CASE (random() * 3)::INTEGER WHEN 0 THEN 'email' WHEN 1 THEN 'phone' ELSE 'text' END,
                'skills', ARRAY[v_skills[1 + (random() * (array_length(v_skills, 1) - 1))::INTEGER]],
                'interests', ARRAY[v_interests[1 + (random() * (array_length(v_interests, 1) - 1))::INTEGER], 
                                  v_interests[1 + (random() * (array_length(v_interests, 1) - 1))::INTEGER]],
                'volunteer_hours', CASE WHEN 'volunteer' = ANY(v_tag_set) THEN (random() * 100)::INTEGER ELSE 0 END
            ),
            CASE (random() * 6)::INTEGER
                WHEN 0 THEN 'manual'
                WHEN 1 THEN 'import'
                WHEN 2 THEN 'api'
                WHEN 3 THEN 'form'
                WHEN 4 THEN 'referral'
                ELSE 'event'
            END,
            v_engagement_score,
            CASE 
                WHEN v_engagement_score > 80 THEN 'Very active volunteer. Reliable and committed.'
                WHEN v_engagement_score > 60 THEN 'Regular participant. Shows good potential.'
                WHEN v_engagement_score > 40 THEN 'Occasional supporter. Needs more engagement.'
                ELSE NULL
            END,
            CASE 
                WHEN v_engagement_score > 50 THEN NOW() - (random() * 30 || ' days')::INTERVAL
                ELSE NOW() - (random() * 180 || ' days')::INTERVAL
            END,
            v_demo_user_id,
            NOW() - (random() * 365 || ' days')::INTERVAL
        );
    END LOOP;
END $$;

-- GROUPS WITH REALISTIC MEMBERSHIPS
DELETE FROM groups WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO groups (organization_id, name, description, settings, tags, is_active, group_type, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Core Volunteers', 'Our most active and reliable volunteers who form the backbone of our organizing', '{"meeting_schedule": "weekly", "communication": "slack", "meeting_day": "Tuesday", "meeting_time": "19:00"}'::jsonb, ARRAY['volunteers', 'core', 'leadership'], true, 'volunteer_team', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Phone Bank Team', 'Dedicated volunteers who make calls for our campaigns', '{"training_required": true, "tools": ["dialer", "scripts"], "shift_times": ["weekday_evening", "weekend_afternoon"]}'::jsonb, ARRAY['phone-bank', 'outreach'], true, 'action_team', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Canvassing Crew', 'Field team that does door-to-door outreach', '{"training_required": true, "equipment": ["clipboards", "literature", "tablets"]}'::jsonb, ARRAY['canvassing', 'field', 'outreach'], true, 'action_team', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Major Donors', 'Supporters who have made significant financial contributions', '{"benefits": ["quarterly-briefings", "exclusive-events", "direct-access"]}'::jsonb, ARRAY['donors', 'vip', 'fundraising'], true, 'donor_circle', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Student Alliance', 'High school and college students organizing on campuses', '{"meetings": "bi-weekly", "campuses": ["State University", "Community College", "Lincoln High"]}'::jsonb, ARRAY['students', 'youth', 'campus'], true, 'working_group', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Digital Warriors', 'Social media team and online organizers', '{"platforms": ["twitter", "instagram", "tiktok", "facebook"], "content_calendar": true}'::jsonb, ARRAY['social-media', 'digital', 'communications'], true, 'working_group', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Policy Research Team', 'Volunteers who research issues and draft policy proposals', '{"focus_areas": ["housing", "climate", "education", "healthcare"]}'::jsonb, ARRAY['research', 'policy', 'leadership'], true, 'working_group', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add members to groups based on tags
INSERT INTO group_members (group_id, contact_id, organization_id, role, added_by)
SELECT 
  g.id,
  c.id,
  c.organization_id,
  CASE 
    WHEN c.engagement_score > 85 AND random() < 0.2 THEN 'lead'
    WHEN c.engagement_score > 70 AND random() < 0.3 THEN 'coordinator'
    ELSE 'member'
  END,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts c
CROSS JOIN groups g
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND g.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND (
    (g.name = 'Core Volunteers' AND c.tags && ARRAY['volunteer', 'high-engagement'])
    OR (g.name = 'Phone Bank Team' AND c.tags && ARRAY['phone-banker'])
    OR (g.name = 'Canvassing Crew' AND c.tags && ARRAY['canvasser'])
    OR (g.name = 'Major Donors' AND c.tags && ARRAY['donor'] AND c.engagement_score > 70)
    OR (g.name = 'Student Alliance' AND c.tags && ARRAY['student'])
    OR (g.name = 'Digital Warriors' AND c.tags && ARRAY['social-media-influencer'])
    OR (g.name = 'Policy Research Team' AND c.engagement_score > 80 AND random() < 0.1)
  );

-- Update group member counts
UPDATE groups SET member_count = (
  SELECT COUNT(*) FROM group_members WHERE group_id = groups.id
)
WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- EVENTS (Past and upcoming, showing an active organization)
DELETE FROM event_registrations WHERE event_id IN (SELECT id FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Past successful events
INSERT INTO events (organization_id, name, description, start_time, end_time, event_type, location, capacity, tags, created_by, is_published, registration_required, settings) VALUES
-- Last month's events
('00000000-0000-0000-0000-000000000001'::uuid, 'March for Climate Justice', 'Massive rally that brought together 5,000+ people demanding climate action', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '3 hours', 'rally', 'City Hall Plaza to State Capitol', 5000, ARRAY['rally', 'climate', 'mass-action', 'success'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, false, '{"attendance": 5234, "media_coverage": true, "arrests": 0}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Volunteer Appreciation Dinner', 'Celebrated our amazing volunteers with dinner and awards', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '3 hours', 'social', 'Community Center Main Hall', 150, ARRAY['social', 'volunteers', 'appreciation'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"catered": true, "awards_given": 12}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Weekend Canvass Blitz', 'Knocked on 2,000 doors across 5 neighborhoods', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'canvass', 'Multiple Locations - Meet at HQ', 80, ARRAY['canvass', 'field', 'weekend', 'success'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"doors_knocked": 2147, "conversations": 892, "commitments": 234}'::jsonb),

-- Recent events
('00000000-0000-0000-0000-000000000001'::uuid, 'Emergency Response: Save Our Schools', 'Rapid response to proposed school closures', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours', 'meeting', 'Washington Elementary Auditorium', 300, ARRAY['emergency', 'education', 'community'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, false, '{"attendance": 347, "petition_signatures": 523}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Phone Bank Tuesday', 'Regular weekly phone banking session', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours', 'phone_bank', 'Campaign HQ - 2nd Floor', 25, ARRAY['phone-bank', 'weekly', 'outreach'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"calls_made": 312, "contacts_reached": 89}'::jsonb),

-- Upcoming events
('00000000-0000-0000-0000-000000000001'::uuid, 'Housing Justice Town Hall', 'Community forum on rent control and tenant rights', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours 30 minutes', 'meeting', 'Martin Luther King Jr. Community Center', 400, ARRAY['town-hall', 'housing', 'community-forum'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"spanish_translation": true, "childcare": true, "livestream": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Volunteer Training: Direct Action', 'Learn nonviolent direct action tactics and legal rights', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '4 hours', 'training', 'Union Hall - Room 201', 60, ARRAY['training', 'direct-action', 'required'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"lunch_provided": true, "legal_observers": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Weekend of Action: Knock Every Door', 'Massive canvass to reach every voter in District 5', NOW() + INTERVAL '10 days', NOW() + INTERVAL '12 days', 'canvass', 'Multiple Staging Locations', 200, ARRAY['canvass', 'gotv', 'weekend', 'all-hands'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"goal_doors": 10000, "shifts": ["9am", "1pm", "5pm"]}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Fundraising Gala: Power to the People', 'Annual fundraising dinner with special guest speakers', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '4 hours', 'fundraiser', 'Grand Ballroom - Downtown Hotel', 300, ARRAY['fundraising', 'gala', 'major-donors'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"ticket_price": 150, "sponsorship_levels": true, "silent_auction": true}'::jsonb),
('00000000-0000-0000-0000-000000000001'::uuid, 'Student Walkout Planning Meeting', 'Organize citywide student walkout for climate action', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '2 hours', 'meeting', 'Youth Center - Main Room', 100, ARRAY['students', 'planning', 'climate', 'youth'], (SELECT id FROM users WHERE email = 'demo@example.com'), true, true, '{"schools_represented": 12, "pizza": true}'::jsonb);

-- Add event registrations
DO $$
DECLARE
    v_event RECORD;
    v_contact RECORD;
    v_registrations INTEGER;
BEGIN
    FOR v_event IN SELECT * FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid LOOP
        -- Determine number of registrations based on event type and whether it's past
        IF v_event.start_time < NOW() THEN
            v_registrations := CASE 
                WHEN v_event.capacity IS NULL THEN 50 + (random() * 150)::INTEGER
                ELSE (v_event.capacity * (0.6 + random() * 0.35))::INTEGER
            END;
        ELSE
            v_registrations := CASE 
                WHEN v_event.capacity IS NULL THEN 20 + (random() * 80)::INTEGER
                ELSE (v_event.capacity * (0.3 + random() * 0.5))::INTEGER
            END;
        END IF;
        
        -- Add registrations from relevant contacts
        INSERT INTO event_registrations (event_id, contact_id, organization_id, full_name, email, phone, status, registration_source, registered_at)
        SELECT 
            v_event.id,
            c.id,
            c.organization_id,
            c.full_name,
            c.email,
            c.phone,
            CASE 
                WHEN v_event.start_time < NOW() THEN
                    CASE WHEN random() < 0.85 THEN 'attended' ELSE 'no_show' END
                ELSE 'registered'
            END,
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN 'website'
                WHEN 1 THEN 'email'
                ELSE 'manual'
            END,
            v_event.created_at + (random() * (CASE WHEN v_event.start_time < NOW() THEN v_event.start_time - v_event.created_at ELSE NOW() - v_event.created_at END))
        FROM contacts c
        WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
            AND c.status = 'active'
            AND (
                (v_event.tags && ARRAY['phone-bank'] AND c.tags && ARRAY['phone-banker'])
                OR (v_event.tags && ARRAY['canvass'] AND c.tags && ARRAY['canvasser'])
                OR (v_event.tags && ARRAY['students'] AND c.tags && ARRAY['student'])
                OR (v_event.tags && ARRAY['training'] AND c.tags && ARRAY['volunteer'])
                OR (v_event.tags && ARRAY['fundraising'] AND c.tags && ARRAY['donor'])
                OR (c.engagement_score > 60 AND random() < 0.3)
                OR (c.engagement_score > 40 AND random() < 0.1)
            )
        ORDER BY 
            CASE 
                WHEN v_event.tags && c.tags THEN 0 
                ELSE 1 
            END,
            c.engagement_score DESC,
            random()
        LIMIT v_registrations;
    END LOOP;
END $$;

-- PATHWAYS (Engagement journeys)
DELETE FROM pathway_steps WHERE pathway_id IN (SELECT id FROM pathways WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid);
DELETE FROM pathways WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO pathways (organization_id, name, description, pathway_type, status, created_by) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'New Volunteer Onboarding', 'Comprehensive 30-day journey to activate new volunteers', 'onboarding', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Supporter to Organizer', 'Transform passive supporters into active organizers over 90 days', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Major Donor Journey', 'Cultivation pathway for donors capable of $1,000+ gifts', 'fundraising', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Leadership Academy', 'Six-month intensive program to develop movement leaders', 'leadership', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Win-Back Campaign', 'Re-engage supporters who haven''t been active in 6+ months', 'reactivation', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('00000000-0000-0000-0000-000000000001'::uuid, 'Rapid Response Network', 'Quick activation pathway for urgent actions', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add detailed pathway steps
-- New Volunteer Onboarding steps
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  p.id, 
  step.step_order,
  step.name,
  step.description,
  step.step_type,
  step.trigger_type,
  step.trigger_value,
  step.action_type,
  step.action_value,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways p
CROSS JOIN (
  VALUES 
    (1, 'Welcome Email', 'Send immediate welcome with our story and values', 'action', 'immediate', NULL, 'email', '{"template": "welcome_volunteer", "subject": "Welcome to the movement!"}'),
    (2, 'Orientation Invite', 'Invite to next volunteer orientation', 'action', 'delay', '{"days": 2}', 'email', '{"template": "orientation_invite", "include_calendar_link": true}'),
    (3, 'Personal Welcome Call', 'Leader makes personal welcome call', 'action', 'delay', '{"days": 3}', 'task', '{"assign_to": "team_lead", "script": "welcome_call_script"}'),
    (4, 'First Action Opportunity', 'Invite to easy first action', 'action', 'delay', '{"days": 7}', 'email', '{"template": "first_action", "action_type": "petition_or_easy_event"}'),
    (5, 'Check Engagement', 'Track if they took action', 'condition', 'delay', '{"days": 14}', NULL, NULL),
    (6, 'Follow Up or Celebrate', 'Different path based on engagement', 'action', 'delay', '{"days": 15}', 'email', '{"template": "conditional_based_on_step_5"}'),
    (7, 'Add to Teams', 'Invite to join specific teams', 'action', 'delay', '{"days": 21}', 'task', '{"action": "add_to_relevant_groups"}'),
    (8, 'One Month Check-in', 'Survey and next steps', 'action', 'delay', '{"days": 30}', 'email', '{"template": "one_month_survey", "include_impact_report": true}')
) AS step(step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value)
WHERE p.name = 'New Volunteer Onboarding' AND p.organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Add members to pathways
INSERT INTO pathway_members (pathway_id, contact_id, organization_id, current_step, started_at, completed_at)
SELECT 
  p.id,
  c.id,
  c.organization_id,
  CASE 
    WHEN c.created_at < NOW() - INTERVAL '30 days' THEN 8
    WHEN c.created_at < NOW() - INTERVAL '21 days' THEN 7
    WHEN c.created_at < NOW() - INTERVAL '14 days' THEN 5
    WHEN c.created_at < NOW() - INTERVAL '7 days' THEN 4
    WHEN c.created_at < NOW() - INTERVAL '3 days' THEN 3
    ELSE 1
  END,
  c.created_at,
  CASE 
    WHEN c.created_at < NOW() - INTERVAL '30 days' THEN c.created_at + INTERVAL '30 days'
    ELSE NULL
  END
FROM contacts c
CROSS JOIN pathways p
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND p.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND p.name = 'New Volunteer Onboarding'
  AND c.tags && ARRAY['volunteer']
  AND c.created_at > NOW() - INTERVAL '60 days'
LIMIT 50;

-- CAMPAIGNS (Multiple active campaigns showing a vibrant organization)
DELETE FROM campaigns WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_demo_user_id UUID;
  v_campaign_id UUID;
BEGIN
  -- Get demo user
  SELECT u.id INTO v_demo_user_id FROM users u WHERE u.email = 'demo@example.com';

  -- 1. Climate Justice Petition (Active, near goal)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Declare Climate Emergency NOW!',
    'petition',
    'active',
    'Demand our city council declare a climate emergency and commit to carbon neutrality by 2030. We need bold action to save our planet!',
    10000,
    8932,
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '30 days',
    jsonb_build_object(
      'target', 'City Council',
      'delivery_date', (NOW() + INTERVAL '30 days')::DATE,
      'petition_text', 'We, the undersigned residents, demand that our City Council declare a climate emergency...',
      'allow_comments', true,
      'share_buttons', true,
      'email_council', true,
      'tags', ARRAY['climate', 'emergency', 'environment', 'priority']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- Add petition signatures with realistic distribution over time
  INSERT INTO petition_signatures (
    campaign_id, contact_id, organization_id, full_name, email, phone, comment, is_public, signed_at
  )
  SELECT 
    v_campaign_id,
    c.id,
    v_org_id,
    c.full_name,
    c.email,
    c.phone,
    CASE 
      WHEN random() < 0.3 THEN 
        CASE (random() * 5)::INTEGER
          WHEN 0 THEN 'This is the most important issue of our time!'
          WHEN 1 THEN 'For our children and grandchildren!'
          WHEN 2 THEN 'We need action NOW, not more delays!'
          WHEN 3 THEN 'I''m tired of empty promises. We need real change!'
          ELSE 'Climate justice is social justice!'
        END
      ELSE NULL
    END,
    random() < 0.7, -- 70% public
    NOW() - (random() * INTERVAL '60 days')
  FROM contacts c
  WHERE c.organization_id = v_org_id
    AND c.status = 'active'
    AND random() < 0.4 -- 40% of active contacts sign
  LIMIT 8932;

  -- 2. Rent Control Campaign (Active, building momentum)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Rent Control NOW: Stop Displacement!',
    'petition',
    'active',
    'Support rent control to keep families in their homes. Rents have increased 40% in 3 years while wages stayed flat!',
    7500,
    4234,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    jsonb_build_object(
      'target', 'Mayor Johnson and City Council',
      'petition_text', 'We demand immediate action on rent control...',
      'allow_comments', true,
      'tags', ARRAY['housing', 'rent-control', 'tenant-rights', 'urgent']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- 3. Save Our Schools Phone Bank (Active)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Save Our Schools: Stop the Closures!',
    'phone_bank',
    'active',
    'Call voters to stop the proposed closure of 5 neighborhood schools. Our children deserve better!',
    5000,
    2847,
    NOW() - INTERVAL '14 days',
    NOW() + INTERVAL '14 days',
    jsonb_build_object(
      'script_name', 'Save Schools Script v2',
      'target_list', 'Registered voters in affected districts',
      'call_hours', jsonb_build_object('start', '10:00', 'end', '20:00'),
      'talking_points', ARRAY[
        '5 schools slated for closure',
        '3,000 students affected',
        'Alternatives exist - board just won''t consider them',
        'Next board meeting is our last chance'
      ],
      'tags', ARRAY['education', 'schools', 'phone-bank', 'urgent']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- Add phone bank sessions
  INSERT INTO phonebank_sessions (
    campaign_id, user_id, organization_id, contact_id, call_duration, outcome, notes, started_at, ended_at
  )
  SELECT 
    v_campaign_id,
    v_demo_user_id,
    v_org_id,
    c.id,
    30 + (random() * 300)::INTEGER, -- 30 seconds to 5 minutes
    CASE (random() * 10)::INTEGER
      WHEN 0 THEN 'no_answer'
      WHEN 1 THEN 'voicemail'
      WHEN 2 THEN 'busy'
      WHEN 3 THEN 'wrong_number'
      WHEN 4 THEN 'do_not_call'
      ELSE 'answered'
    END,
    CASE (random() * 10)::INTEGER
      WHEN 0 THEN 'Strong supporter - will attend board meeting'
      WHEN 1 THEN 'Needs more info - sending email'
      WHEN 2 THEN 'Already contacted board member!'
      WHEN 3 THEN 'Undecided but listening'
      WHEN 4 THEN 'Against but respectful'
      ELSE NULL
    END,
    NOW() - (random() * INTERVAL '14 days'),
    NOW() - (random() * INTERVAL '14 days') + ((30 + (random() * 300)::INTEGER) * INTERVAL '1 second')
  FROM contacts c
  WHERE c.organization_id = v_org_id
    AND c.tags && ARRAY['phone-banker']
  LIMIT 200;

  -- 4. Community Canvas Campaign (Active)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Knock Every Door: District 5 Deep Canvass',
    'canvas',
    'active',
    'Deep canvassing in District 5 to build power for housing justice. Every conversation matters!',
    2500,
    1876,
    NOW() - INTERVAL '21 days',
    NOW() + INTERVAL '7 days',
    jsonb_build_object(
      'target_area', 'District 5 - All precincts',
      'focus_issues', ARRAY['rent_control', 'tenant_rights', 'affordable_housing'],
      'materials', ARRAY['rent_control_flyer', 'know_your_rights_card', 'event_invite'],
      'staging_location', '789 Community Way',
      'shift_times', ARRAY['10am-1pm', '2pm-5pm', '5:30pm-7:30pm'],
      'tags', ARRAY['canvassing', 'field', 'housing', 'district-5']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- Add canvassing activities
  INSERT INTO campaign_activities (
    campaign_id, contact_id, organization_id, activity_type, outcome, notes, details, user_id, created_at
  )
  SELECT 
    v_campaign_id,
    c.id,
    v_org_id,
    'canvass',
    CASE (random() * 10)::INTEGER
      WHEN 0 THEN 'not_home'
      WHEN 1 THEN 'refused'
      WHEN 2 THEN 'moved'
      ELSE 'contacted'
    END,
    CASE (random() * 10)::INTEGER
      WHEN 0 THEN 'Strong supporter - wants yard sign'
      WHEN 1 THEN 'Tenant facing eviction - connected to legal aid'
      WHEN 2 THEN 'Interested in volunteering'
      WHEN 3 THEN 'Already signed petition online'
      WHEN 4 THEN 'Undecided - gave literature'
      ELSE NULL
    END,
    jsonb_build_object(
      'address', c.address,
      'issues_discussed', ARRAY['rent_control', 'tenant_rights'],
      'follow_up_needed', random() < 0.3,
      'literature_left', random() < 0.8
    ),
    v_demo_user_id,
    NOW() - (random() * INTERVAL '21 days')
  FROM contacts c
  WHERE c.organization_id = v_org_id
    AND c.tags && ARRAY['canvasser']
    AND random() < 0.5
  LIMIT 300;

  -- 5. Fundraising Campaign (Active)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Power to the People: 2024 Organizing Fund',
    'donation',
    'active',
    'Fuel our fight for justice! Every dollar powers grassroots organizing for real change.',
    100000,
    67845,
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '45 days',
    jsonb_build_object(
      'donation_levels', jsonb_build_array(
        jsonb_build_object('amount', 25, 'label', 'Supporter', 'perks', 'Movement updates'),
        jsonb_build_object('amount', 50, 'label', 'Activist', 'perks', 'Bumper sticker + updates'),
        jsonb_build_object('amount', 100, 'label', 'Organizer', 'perks', 'T-shirt + quarterly calls'),
        jsonb_build_object('amount', 250, 'label', 'Leader', 'perks', 'All above + event invites'),
        jsonb_build_object('amount', 500, 'label', 'Champion', 'perks', 'All above + monthly briefings'),
        jsonb_build_object('amount', 1000, 'label', 'Founder', 'perks', 'All above + strategy sessions')
      ),
      'recurring_enabled', true,
      'matching_active', true,
      'matching_details', 'All gifts matched 2:1 up to $25,000!',
      'tags', ARRAY['fundraising', 'year-end', 'matching']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- Add donations
  INSERT INTO campaign_donations (
    campaign_id, contact_id, organization_id, amount, currency, status, donated_at
  )
  SELECT 
    v_campaign_id,
    c.id,
    v_org_id,
    CASE 
      WHEN c.tags && ARRAY['major-donor'] THEN (ARRAY[500, 1000, 2500, 5000])[1 + (random() * 3)::INTEGER]
      WHEN c.tags && ARRAY['donor'] THEN (ARRAY[50, 100, 250, 500])[1 + (random() * 3)::INTEGER]
      ELSE (ARRAY[25, 50, 100])[1 + (random() * 2)::INTEGER]
    END,
    'USD',
    'completed',
    NOW() - (random() * INTERVAL '45 days')
  FROM contacts c
  WHERE c.organization_id = v_org_id
    AND (c.tags && ARRAY['donor'] OR (c.engagement_score > 60 AND random() < 0.2))
  LIMIT 234;

  -- 6. Email Campaign (Recently completed, successful)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Victory! Thank Our Champions',
    'email',
    'completed',
    'Email campaign thanking the 3 council members who voted for our affordable housing proposal',
    5000,
    5234,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days',
    jsonb_build_object(
      'subject', 'Thank you for standing with the community!',
      'send_count', 5234,
      'open_rate', 68.4,
      'click_rate', 24.7,
      'unsubscribe_rate', 0.3,
      'council_members_thanked', ARRAY['Maria Santos', 'James Liu', 'Fatima Al-Rahman'],
      'tags', ARRAY['email', 'thank-you', 'victory', 'housing']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- 7. SMS Campaign (Active, rapid response)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'Text RESIST: Rapid Response Network',
    'sms',
    'active',
    'SMS alert system for urgent actions. When injustice strikes, we mobilize!',
    1000,
    743,
    NOW() - INTERVAL '120 days',
    NULL, -- Ongoing
    jsonb_build_object(
      'keyword', 'RESIST',
      'short_code', '555777',
      'auto_response', 'You''re in! We''ll text you for urgent actions only. Reply STOP to unsubscribe.',
      'last_alert', NOW() - INTERVAL '4 days',
      'total_alerts_sent', 12,
      'avg_response_rate', 34.7,
      'tags', ARRAY['sms', 'rapid-response', 'alerts', 'ongoing']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

  -- 8. Event Campaign (Upcoming major event)
  INSERT INTO campaigns (
    organization_id, name, type, status, description, goal, current_value,
    start_date, end_date, settings, created_by
  ) VALUES (
    v_org_id,
    'People''s Assembly: Building Our Agenda',
    'event',
    'active',
    'Community assembly to democratically decide our 2024 priorities. Your voice matters!',
    500,
    287,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '14 days',
    jsonb_build_object(
      'event_date', (NOW() + INTERVAL '14 days')::DATE,
      'event_time', '10:00 AM - 4:00 PM',
      'location', 'Washington High School Auditorium',
      'agenda_items', ARRAY['Housing', 'Climate', 'Education', 'Healthcare', 'Criminal Justice'],
      'facilitators', ARRAY['Rev. Jackson', 'Maria Rodriguez', 'Prof. Chen'],
      'lunch_provided', true,
      'childcare', true,
      'translation', ARRAY['Spanish', 'Mandarin', 'Arabic'],
      'livestream', true,
      'tags', ARRAY['event', 'assembly', 'democracy', 'planning']
    ),
    v_demo_user_id
  ) RETURNING id INTO v_campaign_id;

END $$;

-- CONTACT INTERACTIONS (Showing ongoing engagement)
-- Add varied interactions showing an active organization
DO $$
DECLARE
    v_contact RECORD;
    v_user_id UUID;
    v_interaction_count INTEGER;
    v_days_ago INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'demo@example.com';
    
    -- For each contact, add some recent interactions based on their engagement
    FOR v_contact IN 
        SELECT * FROM contacts 
        WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        ORDER BY engagement_score DESC 
        LIMIT 200
    LOOP
        -- More interactions for highly engaged contacts
        v_interaction_count := CASE 
            WHEN v_contact.engagement_score > 80 THEN 3 + (random() * 4)::INTEGER
            WHEN v_contact.engagement_score > 60 THEN 2 + (random() * 3)::INTEGER
            WHEN v_contact.engagement_score > 40 THEN 1 + (random() * 2)::INTEGER
            ELSE (random() * 2)::INTEGER
        END;
        
        FOR i IN 1..v_interaction_count LOOP
            v_days_ago := (random() * 90)::INTEGER;
            
            INSERT INTO contact_interactions (
                contact_id, organization_id, user_id, type, direction, status, 
                duration, outcome, notes, created_at
            )
            VALUES (
                v_contact.id,
                v_contact.organization_id,
                v_user_id,
                (ARRAY['call', 'text', 'email', 'note', 'tag_added', 'event'])[1 + (random() * 5)::INTEGER],
                CASE WHEN random() < 0.8 THEN 'outbound' ELSE 'inbound' END,
                CASE WHEN random() < 0.9 THEN 'completed' ELSE 'no_answer' END,
                CASE WHEN random() < 0.3 THEN 60 + (random() * 240)::INTEGER ELSE NULL END,
                CASE (random() * 5)::INTEGER
                    WHEN 0 THEN 'positive'
                    WHEN 1 THEN 'neutral'
                    WHEN 2 THEN 'needs_follow_up'
                    ELSE NULL
                END,
                CASE (random() * 10)::INTEGER
                    WHEN 0 THEN 'Great conversation about rent control'
                    WHEN 1 THEN 'Confirmed for phone bank Tuesday'
                    WHEN 2 THEN 'Interested in joining climate committee'
                    WHEN 3 THEN 'Donated $50!'
                    WHEN 4 THEN 'Will bring 5 friends to rally'
                    WHEN 5 THEN 'Needs ride to event'
                    WHEN 6 THEN 'Volunteered to host house party'
                    WHEN 7 THEN 'Signed up for monthly donation'
                    WHEN 8 THEN 'Wants to learn more about issues'
                    ELSE NULL
                END,
                NOW() - (v_days_ago || ' days')::INTERVAL
            );
        END LOOP;
        
        -- Update last contact date
        UPDATE contacts 
        SET last_contact_date = NOW() - ((random() * 30)::INTEGER || ' days')::INTERVAL
        WHERE id = v_contact.id;
    END LOOP;
END $$;

-- COMMUNICATION LOGS (Email and SMS history)
INSERT INTO communication_logs (
    organization_id, contact_id, campaign_id, type, direction, status,
    to_address, from_address, subject, provider, sent_at
)
SELECT 
    c.organization_id,
    c.id,
    camp.id,
    'email',
    'outbound',
    CASE (random() * 10)::INTEGER
        WHEN 0 THEN 'bounced'
        WHEN 1 THEN 'failed'
        WHEN 2 THEN 'sent'
        WHEN 3 THEN 'sent'
        WHEN 4 THEN 'delivered'
        WHEN 5 THEN 'delivered'
        WHEN 6 THEN 'delivered'
        WHEN 7 THEN 'opened'
        WHEN 8 THEN 'opened'
        ELSE 'clicked'
    END,
    c.email,
    'action@risecommunity.org',
    'Join us this Saturday - ' || camp.name,
    'sendgrid',
    camp.created_at + (random() * (NOW() - camp.created_at))
FROM contacts c
CROSS JOIN campaigns camp
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    AND camp.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    AND camp.type = 'email'
    AND random() < 0.3
LIMIT 500;

-- Final summary
DO $$
DECLARE
    v_contact_count INTEGER;
    v_event_count INTEGER;
    v_campaign_count INTEGER;
    v_group_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_contact_count FROM contacts WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
    SELECT COUNT(*) INTO v_event_count FROM events WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
    SELECT COUNT(*) INTO v_campaign_count FROM campaigns WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
    SELECT COUNT(*) INTO v_group_count FROM groups WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    RAISE NOTICE '
🎉 ENHANCED SEED DATA LOADED SUCCESSFULLY!

Organization: Rise Community Action
Demo User: demo@example.com / demo123

📊 Data Summary:
- Contacts: % total (with realistic tags and engagement scores)
- Events: % (mix of past successes and upcoming actions)
- Campaigns: % active (petition, phone bank, canvas, fundraising, etc.)
- Groups: % (volunteers, phone bankers, canvassers, donors, students)
- Thousands of interactions, registrations, and activities

This looks like a VERY active grassroots campaign with:
✊ Active organizing across multiple issues
📱 Regular phone banking and canvassing
💰 Successful fundraising
📧 Engaged email list
🎯 Clear pathways for volunteer development
📈 Strong momentum and growth

Everything you need to demo a thriving movement!
', v_contact_count, v_event_count, v_campaign_count, v_group_count;
END $$;