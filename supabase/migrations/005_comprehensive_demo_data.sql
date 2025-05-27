-- Comprehensive demo data for the demo user account
-- This migration adds realistic data to showcase all features
-- Script modified for direct execution in Supabase SQL Editor

-- IMPORTANT PREREQUISITES:
-- 1. A user with email '''demo@example.com''' MUST exist in auth.users.
-- 2. An organization named '''Demo Organization''' MUST exist in the organizations table.
-- If these do not exist, many INSERT statements below will fail due to NULL foreign key values.

-- =========================================
-- CONTACTS - Add diverse set of contacts
-- =========================================

-- Community Leaders
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Maria Rodriguez''', '''maria.rodriguez@email.com''', '''+1234567001''', '''active''', 
 ARRAY['''community-leader''', '''volunteer''', '''high-engagement'''], 
 '''{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}''',
 '''Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''James Chen''', '''james.chen@email.com''', '''+1234567002''', '''active''',
 ARRAY['''volunteer''', '''event-organizer''', '''youth-leader'''],
 '''{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}''',
 '''Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Sarah Thompson''', '''sarah.t@email.com''', '''+1234567003''', '''active''',
 ARRAY['''donor''', '''board-member''', '''high-value'''],
 '''{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}''',
 '''Board member and major donor. Works in tech sector. Interested in education reform.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Active Volunteers
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''David Kim''', '''dkim@email.com''', '''+1234567004''', '''active''',
 ARRAY['''volunteer''', '''canvasser''', '''phone-banker'''],
 '''{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}''',
 '''Reliable weekend volunteer. Bilingual - helps with Korean community outreach.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Lisa Johnson''', '''lisa.j@email.com''', '''+1234567005''', '''active''',
 ARRAY['''volunteer''', '''event-support''', '''social-media'''],
 '''{"skills": ["photography", "writing"], "district": "Downtown"}''',
 '''Helps with event photography and social media posts. Former journalist.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Robert Williams''', '''rwilliams@email.com''', '''+1234567006''', '''active''',
 ARRAY['''volunteer''', '''driver''', '''setup-crew'''],
 '''{"has_vehicle": true, "availability": "flexible", "district": "Southside"}''',
 '''Has a van - helps transport supplies and people to events. Very dependable.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Prospects and Leads
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Emily Brown''', '''emily.brown@email.com''', '''+1234567007''', '''active''',
 ARRAY['''prospect''', '''interested''', '''parent'''],
 '''{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}''',
 '''Met at PTA meeting. Interested in education advocacy. Has two kids in public school.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Michael Davis''', '''mdavis@email.com''', '''+1234567008''', '''active''',
 ARRAY['''lead''', '''union-member''', '''warm-lead'''],
 '''{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}''',
 '''Teacher at Lincoln High. Expressed interest in organizing fellow teachers.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Angela White''', '''angela.w@email.com''', '''+1234567009''', '''active''',
 ARRAY['''prospect''', '''small-business''', '''community-supporter'''],
 '''{"business": "White's Bakery", "interests": ["local-economy"], "district": "Northside"}''',
 '''Owns local bakery. Supports community events. Potential sponsor.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Past Supporters (Re-engagement targets)
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Patricia Martinez''', '''pmartinez@email.com''', '''+1234567010''', '''inactive''',
 ARRAY['''past-volunteer''', '''donor''', '''reactivation-target'''],
 '''{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}''',
 '''Former active volunteer. Moved but still in area. Worth re-engaging.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Thomas Anderson''', '''tanderson@email.com''', '''+1234567011''', '''inactive''',
 ARRAY['''past-supporter''', '''voter''', '''low-engagement'''],
 '''{"voted": "2020, 2022", "district": "Southside"}''',
 '''Signed petitions in the past. Needs follow-up to reactivate.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- New Sign-ups (Recent additions)
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Jennifer Lee''', '''jlee@email.com''', '''+1234567012''', '''active''',
 ARRAY['''new-signup''', '''interested''', '''student'''],
 '''{"source": "campus-event", "university": "State College", "graduation": "2025", "district": "Downtown"}''',
 '''College student. Signed up at campus voter registration drive.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Carlos Gonzalez''', '''carlos.g@email.com''', '''+1234567013''', '''active''',
 ARRAY['''new-signup''', '''interested''', '''worker'''],
 '''{"source": "rally", "interests": ["workers-rights", "healthcare"], "district": "Eastside"}''',
 '''Met at minimum wage rally. Works in restaurant industry.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Key Stakeholders
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, notes, created_by, updated_by) VALUES
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Dr. Patricia Edwards''', '''dr.edwards@email.com''', '''+1234567014''', '''active''',
 ARRAY['''stakeholder''', '''expert''', '''speaker'''],
 '''{"expertise": "public-health", "title": "Public Health Director", "district": "Citywide"}''',
 '''Public health expert. Available for speaking at events. Supports health equity initiatives.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Rev. Michael Washington''', '''rev.washington@email.com''', '''+1234567015''', '''active''',
 ARRAY['''stakeholder''', '''faith-leader''', '''community-partner'''],
 '''{"organization": "First Baptist Church", "congregation_size": "500", "district": "Southside"}''',
 '''Pastor of large congregation. Key partner for community events.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- =========================================
-- GROUPS - Organize contacts into groups
-- =========================================

INSERT INTO groups (organization_id, name, description, member_count, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Core Volunteers''', '''Our most active and reliable volunteers''', 0, 
 ARRAY['''active''', '''volunteers'''], (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Add members to Core Volunteers group
INSERT INTO group_members (group_id, contact_id, role, joined_at, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = '''Core Volunteers''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')), 
  c.id, 
  '''member''', 
  NOW(), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
FROM contacts c
WHERE c.organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''') 
AND c.tags && ARRAY['''volunteer''']
LIMIT 5;

INSERT INTO groups (organization_id, name, description, member_count, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Major Donors''', '''Donors who have contributed over $1000''', 0,
 ARRAY['''donors''', '''high-value'''], (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Youth Leaders''', '''Young organizers and student activists''', 0,
 ARRAY['''youth''', '''students'''], (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),

((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Faith Communities''', '''Religious leaders and faith-based partners''', 0,
 ARRAY['''faith''', '''community-partners'''], (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- =========================================
-- EVENTS - Create various types of events
-- =========================================

-- Upcoming Rally
INSERT INTO events (organization_id, name, description, start_time, end_time, location, 
                   capacity, event_type, status, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Community Justice Rally''', 
 '''Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.''',
 NOW() + INTERVAL '''7 days''', NOW() + INTERVAL '''7 days''' + INTERVAL '''3 hours''',
 '''{"venue": "City Hall Plaza", "address": "123 Main St", "city": "Downtown", "instructions": "Meet at the main steps"}''',
 500, '''rally''', '''scheduled''', ARRAY['''rally''', '''justice''', '''community'''],
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Add attendees to the rally
INSERT INTO event_attendees (event_id, contact_id, status, registered_at, registered_by)
SELECT 
  (SELECT id FROM events WHERE name = '''Community Justice Rally''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')), 
  c.id, 
  CASE WHEN RANDOM() < 0.7 THEN '''confirmed''' ELSE '''registered''' END,
  NOW() - INTERVAL '''1 day''' * (1 + FLOOR(RANDOM() * 4)), -- Random interval between 1 and 5 days
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
FROM contacts c
WHERE c.organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''') 
AND c.status = '''active'''
LIMIT 8;

-- Volunteer Training
INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                   capacity, event_type, status, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''New Volunteer Orientation''', 
 '''Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.''',
 NOW() + INTERVAL '''3 days''', NOW() + INTERVAL '''3 days''' + INTERVAL '''2 hours''',
 '''{"venue": "Community Center", "address": "456 Oak Ave", "room": "Conference Room A"}''',
 30, '''training''', '''scheduled''', ARRAY['''training''', '''volunteers''', '''orientation'''],
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Phone Banking Session
INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                   capacity, event_type, status, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Phone Bank for Change''', 
 '''Join us for phone banking! We'll be calling supporters to mobilize for upcoming actions.''',
 NOW() + INTERVAL '''2 days''', NOW() + INTERVAL '''2 days''' + INTERVAL '''3 hours''',
 '''{"venue": "Campaign HQ", "address": "789 Elm St", "parking": "Free parking in rear"}''',
 20, '''phone_bank''', '''scheduled''', ARRAY['''phone-bank''', '''outreach''', '''volunteers'''],
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Community Meeting
INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                   capacity, event_type, status, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Town Hall: Education Funding''', 
 '''Community discussion on the state of education funding. Hear from teachers, parents, and students.''',
 NOW() + INTERVAL '''10 days''', NOW() + INTERVAL '''10 days''' + INTERVAL '''2 hours''',
 '''{"venue": "Lincoln High School", "address": "321 School St", "room": "Auditorium"}''',
 200, '''meeting''', '''scheduled''', ARRAY['''town-hall''', '''education''', '''community'''],
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- Past Event
INSERT INTO events (organization_id, name, description, start_time, end_time, location,
                   capacity, event_type, status, tags, notes, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Voter Registration Drive''', 
 '''Successful voter registration drive in the downtown area.''',
 NOW() - INTERVAL '''14 days''', NOW() - INTERVAL '''14 days''' + INTERVAL '''4 hours''',
 '''{"venue": "Downtown Park", "address": "100 Park Ave"}''',
 100, '''canvass''', '''completed''', ARRAY['''voter-reg''', '''outreach''', '''success'''],
 '''Great turnout! Registered 47 new voters. Maria Rodriguez brought 5 volunteers.''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- =========================================
-- CALL HISTORY - Add call records
-- =========================================

-- Calls for Maria Rodriguez
INSERT INTO calls (
  organization_id, contact_id, direction, duration, status,
  outcome, notes, scheduled_at, started_at, ended_at,
  caller_id, created_by, updated_by
) VALUES (
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  (SELECT id FROM contacts WHERE full_name = '''Maria Rodriguez''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')),
  '''outbound''', FLOOR(RANDOM() * 300 + 30), '''completed''', '''answered''',
  '''Discussed upcoming rally, Maria is attending and bringing 3 friends.''',
  NOW() - INTERVAL '''3 days''', NOW() - INTERVAL '''3 days''', NOW() - INTERVAL '''3 days''' + INTERVAL '''5 minutes''',
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
),
(
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  (SELECT id FROM contacts WHERE full_name = '''Maria Rodriguez''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')),
  '''inbound''', FLOOR(RANDOM() * 180 + 30), '''completed''', '''answered''',
  '''Maria called back to confirm details for the rally.''',
  NULL, NOW() - INTERVAL '''2 days''', NOW() - INTERVAL '''2 days''' + INTERVAL '''3 minutes''',
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
);

-- Calls for James Chen
INSERT INTO calls (
  organization_id, contact_id, direction, duration, status,
  outcome, notes, scheduled_at, started_at, ended_at,
  caller_id, created_by, updated_by
) VALUES (
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  (SELECT id FROM contacts WHERE full_name = '''James Chen''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')),
  '''outbound''', FLOOR(RANDOM() * 400 + 60), '''completed''', '''voicemail''',
  '''Left voicemail about volunteer graphic design needs for the GOTV campaign.''',
  NOW() - INTERVAL '''5 days''', NOW() - INTERVAL '''5 days''', NOW() - INTERVAL '''5 days''' + INTERVAL '''2 minutes''',
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
);

-- Calls for David Kim
INSERT INTO calls (
  organization_id, contact_id, direction, duration, status,
  outcome, notes, scheduled_at, started_at, ended_at,
  caller_id, created_by, updated_by
) VALUES (
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  (SELECT id FROM contacts WHERE full_name = '''David Kim''' AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')),
  '''outbound''', FLOOR(RANDOM() * 250 + 30), '''completed''', '''answered''',
  '''Confirmed David Kim for canvassing next Saturday.''',
  NOW() - INTERVAL '''1 day''', NOW() - INTERVAL '''1 day''', NOW() - INTERVAL '''1 day''' + INTERVAL '''4 minutes''',
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
);

-- =========================================
-- CAMPAIGNS - Create organizing campaigns
-- =========================================

INSERT INTO campaigns (organization_id, name, description, status, start_date, end_date,
                      goals, metrics, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Justice for All 2024''', 
 '''Our major campaign for criminal justice reform. Focus on bail reform and police accountability.''',
 '''active''', NOW() - INTERVAL '''30 days''', NOW() + INTERVAL '''60 days''',
 '''{"contacts_goal": 1000, "events_goal": 10, "volunteers_goal": 50}''',
 '''{"contacts_reached": 245, "events_held": 3, "volunteers_active": 22}''',
 ARRAY['''justice''', '''reform''', '''2024'''], 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

INSERT INTO campaigns (organization_id, name, description, status, start_date, end_date,
                      goals, metrics, tags, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Get Out The Vote''', 
 '''Mobilizing voters for the upcoming election. Focus on historically low-turnout neighborhoods.''',
 '''planning''', NOW() + INTERVAL '''30 days''', NOW() + INTERVAL '''120 days''',
 '''{"voters_registered": 500, "pledge_cards": 1000}''', '''{}''',
 ARRAY['''gotv''', '''voting''', '''elections'''], 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- =========================================
-- PATHWAYS - Create engagement pathways
-- =========================================

INSERT INTO pathways (organization_id, name, description, steps, default_pathway,
                     trigger_conditions, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''New Volunteer Journey''', 
 '''Onboarding pathway for new volunteers to get them engaged and active''',
 '''[
   {"order": 1, "name": "Welcome Email", "type": "email", "delay_days": 0},
   {"order": 2, "name": "Orientation Invite", "type": "email", "delay_days": 3},
   {"order": 3, "name": "First Action", "type": "task", "delay_days": 7},
   {"order": 4, "name": "Check-in Call", "type": "call", "delay_days": 14},
   {"order": 5, "name": "Leadership Opportunity", "type": "email", "delay_days": 30}
 ]''',
 false, '''{"tags": ["new-signup", "volunteer"]}''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

INSERT INTO pathways (organization_id, name, description, steps, default_pathway,
                     trigger_conditions, created_by, updated_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''Donor Cultivation''', 
 '''Pathway to cultivate and upgrade donors''',
 '''[
   {"order": 1, "name": "Thank You Call", "type": "call", "delay_days": 1},
   {"order": 2, "name": "Impact Report", "type": "email", "delay_days": 30},
   {"order": 3, "name": "Event Invitation", "type": "email", "delay_days": 45},
   {"order": 4, "name": "Upgrade Ask", "type": "call", "delay_days": 90}
 ]''',
 false, '''{"tags": ["donor"]}''',
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''), 
 (SELECT id FROM auth.users WHERE email = '''demo@example.com'''));

-- =========================================
-- ENGAGEMENT RECORDS - Track interactions
-- =========================================

-- Add some engagement records for a few specific active contacts
INSERT INTO engagement_records (
  organization_id, contact_id, activity_type, 
  activity_date, notes, created_by
) 
SELECT 
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  c.id, 
  '''email_sent''',
  NOW() - INTERVAL '''5 days''', 
  '''Sent rally invitation''', 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
FROM contacts c
WHERE c.organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')
  AND c.full_name IN ('''Maria Rodriguez''', '''James Chen''', '''Sarah Thompson''');

INSERT INTO engagement_records (
  organization_id, contact_id, activity_type, 
  activity_date, notes, created_by
) 
SELECT 
  (SELECT id FROM organizations WHERE name = '''Demo Organization'''), 
  c.id, 
  '''event_attended''',
  NOW() - INTERVAL '''20 days''', 
  '''Attended volunteer training''', 
  (SELECT id FROM auth.users WHERE email = '''demo@example.com''')
FROM contacts c
WHERE c.organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''')
  AND c.full_name IN ('''David Kim''', '''Lisa Johnson''');


-- =========================================
-- TAGS - Add some predefined tags
-- =========================================

INSERT INTO tags (organization_id, name, category, color, description, created_by)
VALUES 
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''high-priority''', '''engagement''', '''#FF0000''', '''Contacts needing immediate attention''', (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''monthly-donor''', '''donor''', '''#00AA00''', '''Recurring monthly donors''', (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''spanish-speaker''', '''language''', '''#0066CC''', '''Spanish speaking contacts''', (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''board-member''', '''leadership''', '''#660099''', '''Board members and advisors''', (SELECT id FROM auth.users WHERE email = '''demo@example.com''')),
((SELECT id FROM organizations WHERE name = '''Demo Organization'''), '''2024-campaign''', '''campaign''', '''#FF6600''', '''Involved in 2024 campaign''', (SELECT id FROM auth.users WHERE email = '''demo@example.com'''))
ON CONFLICT (organization_id, name) DO NOTHING;

-- =========================================
-- Update counts (should be handled by triggers ideally, but good for a script)
-- =========================================
UPDATE groups g
SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization'''))
WHERE organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''');

UPDATE events e  
SET current_attendees = (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization'''))
WHERE organization_id = (SELECT id FROM organizations WHERE name = '''Demo Organization''');

SELECT 'Comprehensive demo data script executed.';