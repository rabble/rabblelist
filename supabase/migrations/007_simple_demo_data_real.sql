-- Simple demo data - just straight inserts, no bullshit

-- Add contacts (first_name, last_name, not full_name)
INSERT INTO contacts (organization_id, first_name, last_name, email, phone, status, tags, custom_fields, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria', 'Rodriguez', 'maria.rodriguez@email.com', '+1234567001', 'active', ARRAY['community-leader', 'volunteer', 'high-engagement'], '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'James', 'Chen', 'james.chen@email.com', '+1234567002', 'active', ARRAY['volunteer', 'event-organizer', 'youth-leader'], '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah', 'Thompson', 'sarah.t@email.com', '+1234567003', 'active', ARRAY['donor', 'board-member', 'high-value'], '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'David', 'Kim', 'dkim@email.com', '+1234567004', 'active', ARRAY['volunteer', 'canvasser', 'phone-banker'], '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lisa', 'Johnson', 'lisa.j@email.com', '+1234567005', 'active', ARRAY['volunteer', 'event-support', 'social-media'], '{"skills": ["photography", "writing"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Robert', 'Williams', 'rwilliams@email.com', '+1234567006', 'active', ARRAY['volunteer', 'driver', 'setup-crew'], '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emily', 'Brown', 'emily.brown@email.com', '+1234567007', 'active', ARRAY['prospect', 'interested', 'parent'], '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael', 'Davis', 'mdavis@email.com', '+1234567008', 'active', ARRAY['lead', 'union-member', 'warm-lead'], '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Angela', 'White', 'angela.w@email.com', '+1234567009', 'active', ARRAY['prospect', 'small-business', 'community-supporter'], '{"business": "Whites Bakery", "interests": ["local-economy"], "district": "Northside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Patricia', 'Martinez', 'pmartinez@email.com', '+1234567010', 'inactive', ARRAY['past-volunteer', 'donor', 'reactivation-target'], '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}', '6f4b77de-d981-4c14-af2e-a271c9733fc7')
ON CONFLICT (organization_id, email) DO NOTHING;

-- Add events (event_date not start_time/end_time)
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, tags, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Justice Rally', 'Join us for a powerful rally demanding justice and equity in our community.', NOW() + INTERVAL '7 days', 'rally', 'City Hall Plaza, 123 Main St', 500, ARRAY['rally', 'justice', 'community'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Volunteer Training', 'Training session for new volunteers.', NOW() + INTERVAL '3 days', 'training', 'Community Center, 456 Oak Ave', 30, ARRAY['training', 'volunteers'], '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Phone Banking Session', 'Call supporters to mobilize for upcoming actions.', NOW() + INTERVAL '2 days', 'phone_bank', 'Campaign HQ, 789 Elm St', 20, ARRAY['phone-bank', 'outreach'], '6f4b77de-d981-4c14-af2e-a271c9733fc7');

-- Add some contact interactions (notes go here, not in contacts table)
INSERT INTO contact_interactions (contact_id, user_id, type, direction, notes) VALUES
((SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com'), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'Long-time community organizer. Leads the tenant rights group. Very influential in Latino community.'),
((SELECT id FROM contacts WHERE email = 'james.chen@email.com'), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'Runs youth programs. Great at mobilizing young voters. Has design skills for campaign materials.'),
((SELECT id FROM contacts WHERE email = 'sarah.t@email.com'), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'note', NULL, 'Board member and major donor. Works in tech sector. Interested in education reform.'),
((SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com'), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'call', 'outbound', 'Discussed upcoming rally. Maria is bringing 3 friends.'),
((SELECT id FROM contacts WHERE email = 'dkim@email.com'), '6f4b77de-d981-4c14-af2e-a271c9733fc7', 'call', 'outbound', 'Confirmed for weekend canvassing.');

-- Add event attendees
INSERT INTO event_attendees (event_id, contact_id, status, registered_by) VALUES
((SELECT id FROM events WHERE name = 'Community Justice Rally'), (SELECT id FROM contacts WHERE email = 'maria.rodriguez@email.com'), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Community Justice Rally'), (SELECT id FROM contacts WHERE email = 'james.chen@email.com'), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Community Justice Rally'), (SELECT id FROM contacts WHERE email = 'dkim@email.com'), 'registered', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Volunteer Training'), (SELECT id FROM contacts WHERE email = 'emily.brown@email.com'), 'registered', '6f4b77de-d981-4c14-af2e-a271c9733fc7'),
((SELECT id FROM events WHERE name = 'Volunteer Training'), (SELECT id FROM contacts WHERE email = 'mdavis@email.com'), 'confirmed', '6f4b77de-d981-4c14-af2e-a271c9733fc7');