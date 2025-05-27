-- Update demo data to use full_name and be relevant for rise.protest.net
-- This should be run AFTER 003_fix_contacts_full_name.sql

-- Clear existing demo contacts
DELETE FROM contact_interactions WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
DELETE FROM event_registrations WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
DELETE FROM group_members WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
DELETE FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Re-insert demo contacts with activist/organizer data
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, source, engagement_score, created_by)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Maria Rodriguez', 'maria.rodriguez@example.com', '+1234567001', 'active', ARRAY['community-leader', 'volunteer', 'high-engagement'], '{"preferred_contact": "phone", "language": "Spanish", "district": "Downtown"}'::jsonb, 'manual', 95, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'James Chen', 'james.chen@example.com', '+1234567002', 'active', ARRAY['volunteer', 'event-organizer', 'youth-leader'], '{"preferred_contact": "email", "skills": ["social media", "graphic design"], "district": "Eastside"}'::jsonb, 'manual', 88, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Sarah Thompson', 'sarah.t@example.com', '+1234567003', 'active', ARRAY['donor', 'board-member', 'high-value'], '{"preferred_contact": "email", "donation_history": "$5000", "employer": "Tech Corp", "district": "Northside"}'::jsonb, 'manual', 92, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'David Kim', 'dkim@example.com', '+1234567004', 'active', ARRAY['volunteer', 'canvasser', 'phone-banker'], '{"availability": "weekends", "languages": ["English", "Korean"], "district": "Westside"}'::jsonb, 'import', 75, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Lisa Johnson', 'lisa.j@example.com', '+1234567005', 'active', ARRAY['volunteer', 'event-support', 'social-media'], '{"skills": ["photography", "writing"], "district": "Downtown"}'::jsonb, 'manual', 82, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Robert Williams', 'rwilliams@example.com', '+1234567006', 'active', ARRAY['volunteer', 'driver', 'setup-crew'], '{"has_vehicle": true, "availability": "flexible", "district": "Southside"}'::jsonb, 'manual', 70, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Emily Brown', 'emily.brown@example.com', '+1234567007', 'active', ARRAY['prospect', 'interested', 'parent'], '{"interests": ["education", "school-funding"], "children": 2, "district": "Eastside"}'::jsonb, 'api', 65, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Michael Davis', 'mdavis@example.com', '+1234567008', 'active', ARRAY['lead', 'union-member', 'warm-lead'], '{"union": "Teachers Union", "interests": ["labor-rights"], "district": "Downtown"}'::jsonb, 'import', 78, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Angela White', 'angela.w@example.com', '+1234567009', 'active', ARRAY['prospect', 'small-business', 'community-supporter'], '{"business": "Whites Bakery", "interests": ["local-economy"], "district": "Northside"}'::jsonb, 'manual', 60, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Patricia Martinez', 'pmartinez@example.com', '+1234567010', 'inactive', ARRAY['past-volunteer', 'donor', 'reactivation-target'], '{"last_activity": "2023-06-15", "past_donations": "$500", "district": "Westside"}'::jsonb, 'import', 45, (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Update existing groups or create activist-focused groups
DELETE FROM groups WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO groups (organization_id, name, description, created_by)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Core Volunteers', 'Our most active and reliable volunteers', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Phone Bank Team', 'Volunteers who make calls for campaigns', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Major Donors', 'Supporters who have donated over $1000', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add group members
INSERT INTO group_members (group_id, contact_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Core Volunteers' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND tags && ARRAY['volunteer']
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, contact_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Phone Bank Team' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND tags && ARRAY['phone-banker']
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, contact_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'Major Donors' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND tags && ARRAY['donor']
ON CONFLICT DO NOTHING;

-- Update group member counts
UPDATE groups SET member_count = (
  SELECT COUNT(*) FROM group_members WHERE group_id = groups.id
);

-- Add some interactions
INSERT INTO contact_interactions (contact_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
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
WHERE c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND u.email = 'demo@example.com'
  AND c.email IN ('maria.rodriguez@example.com', 'james.chen@example.com', 'sarah.t@example.com', 'david.kim@example.com');

-- Add some call interactions
INSERT INTO contact_interactions (contact_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
  u.id,
  'call',
  'outbound',
  'completed',
  180,
  'Discussed upcoming rally. Confirmed attendance.'
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND u.email = 'demo@example.com'
  AND c.email IN ('maria.rodriguez@example.com', 'david.kim@example.com');