-- Demo data that matches what the app actually expects

-- Add contacts with full_name (not first_name/last_name)
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria Rodriguez', 'maria.rodriguez@email.com', '+1234567001', 'active', ARRAY['community-leader', 'volunteer', 'high-engagement'], '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'James Chen', 'james.chen@email.com', '+1234567002', 'active', ARRAY['volunteer', 'event-organizer', 'youth-leader'], '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah Thompson', 'sarah.t@email.com', '+1234567003', 'active', ARRAY['donor', 'board-member', 'high-value'], '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'David Kim', 'dkim@email.com', '+1234567004', 'active', ARRAY['volunteer', 'canvasser', 'phone-banker'], '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lisa Johnson', 'lisa.j@email.com', '+1234567005', 'active', ARRAY['volunteer', 'event-support', 'social-media'], '{"skills": ["photography", "writing"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Robert Williams', 'rwilliams@email.com', '+1234567006', 'active', ARRAY['volunteer', 'driver', 'setup-crew'], '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emily Brown', 'emily.brown@email.com', '+1234567007', 'active', ARRAY['prospect', 'interested', 'parent'], '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael Davis', 'mdavis@email.com', '+1234567008', 'active', ARRAY['lead', 'union-member', 'warm-lead'], '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Angela White', 'angela.w@email.com', '+1234567009', 'active', ARRAY['prospect', 'small-business', 'community-supporter'], '{"business": "Whites Bakery", "interests": ["local-economy"], "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Patricia Martinez', 'pmartinez@email.com', '+1234567010', 'inactive', ARRAY['past-volunteer', 'donor', 'reactivation-target'], '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thomas Anderson', 'tanderson@email.com', '+1234567011', 'inactive', ARRAY['past-supporter', 'voter', 'low-engagement'], '{"voted": "2020, 2022", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jennifer Lee', 'jlee@email.com', '+1234567012', 'active', ARRAY['new-signup', 'interested', 'student'], '{"source": "campus-event", "university": "State College", "graduation": "2025", "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Carlos Gonzalez', 'carlos.g@email.com', '+1234567013', 'active', ARRAY['new-signup', 'interested', 'worker'], '{"source": "rally", "interests": ["workers-rights", "healthcare"], "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dr. Patricia Edwards', 'dr.edwards@email.com', '+1234567014', 'active', ARRAY['stakeholder', 'expert', 'speaker'], '{"expertise": "public-health", "title": "Public Health Director", "district": "Citywide"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rev. Michael Washington', 'rev.washington@email.com', '+1234567015', 'active', ARRAY['stakeholder', 'faith-leader', 'community-partner'], '{"organization": "First Baptist Church", "congregation_size": "500", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7')
ON CONFLICT (organization_id, email) DO NOTHING;

-- Add events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, tags, created_by, is_published) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Justice Rally', 'Join us for a powerful rally demanding justice and equity in our community. Speakers include local leaders and activists.', NOW() + INTERVAL '7 days', 'rally', 'City Hall Plaza, 123 Main St, Downtown', 500, ARRAY['rally', 'justice', 'community'], '6f4b77de-d981-4c14-af2e-a271c9733fc7', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'New Volunteer Orientation', 'Comprehensive training for new volunteers. Learn about our mission, values, and how you can make a difference.', NOW() + INTERVAL '3 days', 'training', 'Community Center, 456 Oak Ave, Conference Room A', 30, ARRAY['training', 'volunteers', 'orientation'], '6f4b77de-d981-4c14-af2e-a271c9733fc7', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Phone Bank for Change', 'Join us for phone banking! We will be calling supporters to mobilize for upcoming actions.', NOW() + INTERVAL '2 days', 'phone_bank', 'Campaign HQ, 789 Elm St, Free parking in rear', 20, ARRAY['phone-bank', 'outreach', 'volunteers'], '6f4b77de-d981-4c14-af2e-a271c9733fc7', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Town Hall: Education Funding', 'Community discussion on the state of education funding. Hear from teachers, parents, and students.', NOW() + INTERVAL '10 days', 'meeting', 'Lincoln High School Auditorium, 321 School St', 200, ARRAY['town-hall', 'education', 'community'], '6f4b77de-d981-4c14-af2e-a271c9733fc7', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Voter Registration Drive', 'Help us register new voters in the downtown area!', NOW() - INTERVAL '14 days', 'canvass', 'Downtown Park, 100 Park Ave', 100, ARRAY['voter-reg', 'outreach', 'success'], '6f4b77de-d981-4c14-af2e-a271c9733fc7', true);

-- Add contact interactions (notes, calls, etc)
INSERT INTO contact_interactions (contact_id, user_id, type, direction, status, notes) VALUES
((SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'completed', 'Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.'),
((SELECT id FROM contacts WHERE email = 'james.chen@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'completed', 'Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.'),
((SELECT id FROM contacts WHERE email = 'sarah.t@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'completed', 'Board member and major donor. Works in tech sector. Interested in education reform.'),
((SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'call', 'outbound', 'completed', 'Discussed upcoming rally. Maria is bringing 3 friends.'),
((SELECT id FROM contacts WHERE email = 'james.chen@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'call', 'outbound', 'completed', 'Left voicemail about volunteer graphic design needs.'),
((SELECT id FROM contacts WHERE email = 'dkim@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'call', 'outbound', 'completed', 'Confirmed for weekend canvassing. Available Saturday morning.'),
((SELECT id FROM contacts WHERE email = 'sarah.t@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'meeting', NULL, 'completed', 'Met to discuss donation strategy for 2024 campaign.'),
((SELECT id FROM contacts WHERE email = 'emily.brown@email.com' LIMIT 1), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'email', 'outbound', 'completed', 'Sent information about education advocacy opportunities.');

-- Add event registrations
INSERT INTO event_registrations (event_id, contact_id, status, registered_by) VALUES
((SELECT id FROM events WHERE name = 'Community Justice Rally' LIMIT 1), (SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Community Justice Rally' LIMIT 1), (SELECT id FROM contacts WHERE email = 'james.chen@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Community Justice Rally' LIMIT 1), (SELECT id FROM contacts WHERE email = 'sarah.t@email.com' LIMIT 1), 'registered', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Community Justice Rally' LIMIT 1), (SELECT id FROM contacts WHERE email = 'dkim@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'New Volunteer Orientation' LIMIT 1), (SELECT id FROM contacts WHERE email = 'emily.brown@email.com' LIMIT 1), 'registered', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'New Volunteer Orientation' LIMIT 1), (SELECT id FROM contacts WHERE email = 'mdavis@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'New Volunteer Orientation' LIMIT 1), (SELECT id FROM contacts WHERE email = 'jlee@email.com' LIMIT 1), 'registered', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Phone Bank for Change' LIMIT 1), (SELECT id FROM contacts WHERE email = 'lisa.j@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Phone Bank for Change' LIMIT 1), (SELECT id FROM contacts WHERE email = 'rwilliams@email.com' LIMIT 1), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7');

-- Add groups
INSERT INTO groups (organization_id, name, description, tags, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Core Volunteers', 'Our most active and reliable volunteers', ARRAY['active', 'volunteers'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Major Donors', 'Donors who have contributed over $1000', ARRAY['donors', 'high-value'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Youth Leaders', 'Young organizers and student activists', ARRAY['youth', 'students'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Faith Communities', 'Religious leaders and faith-based partners', ARRAY['faith', 'community-partners'], '6f4b77de-d981-4c14-af2e-a271c9733fc7');

-- Add group members
INSERT INTO group_members (group_id, contact_id, role, added_by) VALUES
((SELECT id FROM groups WHERE name = 'Core Volunteers' LIMIT 1), (SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Core Volunteers' LIMIT 1), (SELECT id FROM contacts WHERE email = 'james.chen@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Core Volunteers' LIMIT 1), (SELECT id FROM contacts WHERE email = 'dkim@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Core Volunteers' LIMIT 1), (SELECT id FROM contacts WHERE email = 'lisa.j@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Major Donors' LIMIT 1), (SELECT id FROM contacts WHERE email = 'sarah.t@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Youth Leaders' LIMIT 1), (SELECT id FROM contacts WHERE email = 'james.chen@email.com' LIMIT 1), 'leader', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Youth Leaders' LIMIT 1), (SELECT id FROM contacts WHERE email = 'jlee@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM groups WHERE name = 'Faith Communities' LIMIT 1), (SELECT id FROM contacts WHERE email = 'rev.washington@email.com' LIMIT 1), 'member', '6f4b77de-d981-4c14-af2e-a271c9733fc7');