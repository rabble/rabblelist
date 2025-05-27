-- Additional demo data - events and event registrations
-- Run this AFTER 004_update_demo_data_full_name.sql

-- Clear any existing demo events
DELETE FROM event_registrations WHERE event_id IN (SELECT id FROM events WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
DELETE FROM events WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Insert events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, tags, created_by, is_published) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Community Justice Rally', 'Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.', NOW() + INTERVAL '7 days', 'rally', 'City Hall Plaza, 123 Main St, Downtown', 500, ARRAY['rally', 'justice', 'community'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'New Volunteer Orientation', 'Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.', NOW() + INTERVAL '3 days', 'training', 'Community Center, 456 Oak Ave, Conference Room A', 30, ARRAY['training', 'volunteers', 'orientation'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Phone Bank for Change', 'Join us for phone banking! We will be calling supporters to mobilize for upcoming actions.', NOW() + INTERVAL '2 days', 'phone_bank', 'Campaign HQ, 789 Elm St, Free parking in rear', 20, ARRAY['phone-bank', 'outreach', 'volunteers'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Town Hall: Education Funding', 'Community discussion on the state of education funding. Hear from teachers, parents, and students.', NOW() + INTERVAL '10 days', 'meeting', 'Lincoln High School Auditorium, 321 School St', 200, ARRAY['town-hall', 'education', 'community'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Voter Registration Drive', 'Help us register new voters in the downtown area!', NOW() - INTERVAL '14 days', 'canvass', 'Downtown Park, 100 Park Ave', 100, ARRAY['voter-reg', 'outreach', 'success'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Direct Action Training', 'Learn nonviolent direct action tactics and legal rights. Required for participation in upcoming actions.', NOW() + INTERVAL '5 days', 'training', 'Union Hall, 222 Labor Way', 50, ARRAY['training', 'direct-action', 'required'], (SELECT id FROM users WHERE email = 'demo@example.com'), true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Community Potluck & Strategy Session', 'Share a meal and plan our next campaign. Bring a dish to share!', NOW() + INTERVAL '12 days', 'meeting', 'First Baptist Church, 555 Community Blvd', 75, ARRAY['community', 'planning', 'social'], (SELECT id FROM users WHERE email = 'demo@example.com'), true);

-- Register people for events
INSERT INTO event_registrations (event_id, contact_id, status, registered_by)
SELECT 
  e.id,
  c.id,
  CASE WHEN RANDOM() < 0.7 THEN 'confirmed' ELSE 'registered' END,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND e.name = 'Community Justice Rally'
  AND c.tags && ARRAY['volunteer', 'community-leader']
LIMIT 8;

INSERT INTO event_registrations (event_id, contact_id, status, registered_by)
SELECT 
  e.id,
  c.id,
  'registered',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND e.name = 'New Volunteer Orientation'
  AND c.tags && ARRAY['prospect', 'interested']
LIMIT 5;

INSERT INTO event_registrations (event_id, contact_id, status, registered_by)
SELECT 
  e.id,
  c.id,
  'confirmed',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND e.name = 'Phone Bank for Change'
  AND c.tags && ARRAY['phone-banker']
LIMIT 4;