-- Simple demo data inserts - no fancy shit, just data

-- Add contacts for the demo organization
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, created_by, updated_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria Rodriguez', 'maria.rodriguez@email.com', '+1234567001', 'active', ARRAY['community-leader', 'volunteer', 'high-engagement'], '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'James Chen', 'james.chen@email.com', '+1234567002', 'active', ARRAY['volunteer', 'event-organizer', 'youth-leader'], '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah Thompson', 'sarah.t@email.com', '+1234567003', 'active', ARRAY['donor', 'board-member', 'high-value'], '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'David Kim', 'dkim@email.com', '+1234567004', 'active', ARRAY['volunteer', 'canvasser', 'phone-banker'], '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lisa Johnson', 'lisa.j@email.com', '+1234567005', 'active', ARRAY['volunteer', 'event-support', 'social-media'], '{"skills": ["photography", "writing"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Robert Williams', 'rwilliams@email.com', '+1234567006', 'active', ARRAY['volunteer', 'driver', 'setup-crew'], '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emily Brown', 'emily.brown@email.com', '+1234567007', 'active', ARRAY['prospect', 'interested', 'parent'], '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael Davis', 'mdavis@email.com', '+1234567008', 'active', ARRAY['lead', 'union-member', 'warm-lead'], '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Angela White', 'angela.w@email.com', '+1234567009', 'active', ARRAY['prospect', 'small-business', 'community-supporter'], '{"business": "Whites Bakery", "interests": ["local-economy"], "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Patricia Martinez', 'pmartinez@email.com', '+1234567010', 'inactive', ARRAY['past-volunteer', 'donor', 'reactivation-target'], '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thomas Anderson', 'tanderson@email.com', '+1234567011', 'inactive', ARRAY['past-supporter', 'voter', 'low-engagement'], '{"voted": "2020, 2022", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jennifer Lee', 'jlee@email.com', '+1234567012', 'active', ARRAY['new-signup', 'interested', 'student'], '{"source": "campus-event", "university": "State College", "graduation": "2025", "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7', '6f4b77de-d981-4c14-af2e-a271c9733fc7')
ON CONFLICT (organization_id, email) DO NOTHING;

-- Add some events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, tags, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Justice Rally', 'Join us for a powerful rally demanding justice and equity in our community.', NOW() + INTERVAL '7 days', 'rally', 'City Hall Plaza, 123 Main St', 500, ARRAY['rally', 'justice', 'community'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Volunteer Training', 'Training session for new volunteers.', NOW() + INTERVAL '3 days', 'training', 'Community Center, 456 Oak Ave', 30, ARRAY['training', 'volunteers'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Phone Banking Session', 'Call supporters to mobilize for upcoming actions.', NOW() + INTERVAL '2 days', 'phone_bank', 'Campaign HQ, 789 Elm St', 20, ARRAY['phone-bank', 'outreach'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Past Voter Registration', 'Successful voter registration drive.', NOW() - INTERVAL '14 days', 'canvass', 'Downtown Park', 100, ARRAY['voter-reg', 'completed'], '6f4b77de-d981-4c14-af2e-a271c9733fc7');

-- Add some calls
INSERT INTO calls (organization_id, contact_id, direction, duration, status, outcome, scheduled_at, started_at, ended_at, caller_id, created_by, updated_by)
SELECT 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  id,
  'outbound',
  180,
  'completed',
  'answered',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '3 minutes',
  '6f4b77de-d981-4c14-af2e-a271c9733fc7',
  '6f4b77de-d981-4c14-af2e-a271c9733fc7',
  '6f4b77de-d981-4c14-af2e-a271c9733fc7'
FROM contacts
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
LIMIT 5;