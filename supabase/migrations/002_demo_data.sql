-- DEMO DATA FOR CONTACT MANAGER PWA
-- Run this AFTER creating demo@example.com user in Auth

-- Update demo user to admin
UPDATE users 
SET 
  role = 'admin',
  organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  settings = '{"demo": true}'::jsonb,
  phone = '+1234567890'
WHERE email = 'demo@example.com';

-- Add 10 demo contacts
INSERT INTO contacts (organization_id, first_name, last_name, email, phone, status, tags, custom_fields, source, engagement_score, created_by)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'active', ARRAY['prospect', 'high-value'], '{"company": "Acme Corp", "position": "CEO"}'::jsonb, 'manual', 85, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'active', ARRAY['customer'], '{"company": "Tech Solutions", "position": "CTO"}'::jsonb, 'import', 92, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'active', ARRAY['lead'], '{"company": "StartupXYZ", "position": "Founder"}'::jsonb, 'manual', 67, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Alice', 'Williams', 'alice.williams@example.com', '+1234567893', 'inactive', ARRAY['past-customer'], '{"company": "Global Inc", "position": "VP Sales"}'::jsonb, 'import', 45, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Charlie', 'Brown', 'charlie.brown@example.com', '+1234567894', 'active', ARRAY['prospect', 'warm-lead'], '{"company": "Innovation Labs", "position": "Director"}'::jsonb, 'api', 78, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Diana', 'Davis', 'diana.davis@example.com', '+1234567895', 'active', ARRAY['customer', 'vip'], '{"company": "Enterprise Co", "position": "CFO"}'::jsonb, 'manual', 95, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Edward', 'Evans', 'edward.evans@example.com', '+1234567896', 'active', ARRAY['lead', 'newsletter'], '{"company": "Small Biz LLC", "position": "Owner"}'::jsonb, 'import', 55, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Fiona', 'Foster', 'fiona.foster@example.com', '+1234567897', 'active', ARRAY['prospect'], '{"company": "Design Studio", "position": "Creative Director"}'::jsonb, 'api', 72, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'George', 'Green', 'george.green@example.com', '+1234567898', 'inactive', ARRAY['past-customer'], '{"company": "Retail Chain", "position": "Head of Purchasing"}'::jsonb, 'manual', 38, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Helen', 'Harris', 'helen.harris@example.com', '+1234567899', 'active', ARRAY['customer', 'referral'], '{"company": "Consulting Group", "position": "Partner"}'::jsonb, 'referral', 88, (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add 5 demo events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, settings, tags, is_published, registration_required, created_by)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Product Launch Webinar', 'Join us for our exciting new product launch', NOW() + INTERVAL '7 days', 'webinar', 'Online', 500, '{"platform": "Zoom"}'::jsonb, ARRAY['product', 'launch'], true, true, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Customer Success Workshop', 'Learn best practices for customer success', NOW() + INTERVAL '14 days', 'workshop', '123 Main St, New York, NY', 50, '{"catering": true}'::jsonb, ARRAY['training', 'customers'], true, true, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Annual Conference', 'Our biggest event of the year', NOW() + INTERVAL '30 days', 'conference', 'Convention Center, San Francisco, CA', 1000, '{"multi_day": true}'::jsonb, ARRAY['annual', 'networking'], true, true, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Sales Team Training', 'Internal training for sales team', NOW() + INTERVAL '3 days', 'training', 'Office Conference Room', 20, '{"internal": true}'::jsonb, ARRAY['training', 'internal'], false, false, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Partner Meeting', 'Quarterly partner sync', NOW() + INTERVAL '21 days', 'meeting', 'Downtown Hotel', 30, '{"catering": true}'::jsonb, ARRAY['partners', 'quarterly'], true, true, (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add 3 demo groups
INSERT INTO groups (organization_id, name, description, settings, tags, is_active, group_type, created_by)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'VIP Customers', 'Our most valuable customers', '{"benefits": ["priority support", "early access"]}'::jsonb, ARRAY['vip', 'customers'], true, 'customer_segment', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Beta Testers', 'Users testing new features', '{"access_level": "beta"}'::jsonb, ARRAY['beta', 'testing'], true, 'program', (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Newsletter Subscribers', 'Monthly newsletter recipients', '{"frequency": "monthly"}'::jsonb, ARRAY['marketing', 'newsletter'], true, 'mailing_list', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add members to groups
INSERT INTO group_members (group_id, contact_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'VIP Customers' LIMIT 1),
  id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND email IN ('jane.smith@example.com', 'diana.davis@example.com', 'helen.harris@example.com');

-- Update group member counts
UPDATE groups SET member_count = (
  SELECT COUNT(*) FROM group_members WHERE group_id = groups.id
);

-- Add some interactions
INSERT INTO contact_interactions (contact_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
  u.id,
  CASE (RANDOM() * 3)::INT 
    WHEN 0 THEN 'call' 
    WHEN 1 THEN 'email' 
    ELSE 'meeting' 
  END,
  CASE (RANDOM() * 2)::INT 
    WHEN 0 THEN 'inbound' 
    ELSE 'outbound' 
  END,
  'completed',
  CASE (RANDOM() * 3)::INT 
    WHEN 0 THEN (RANDOM() * 600 + 30)::INT 
    ELSE NULL 
  END,
  'Demo interaction'
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND u.email = 'demo@example.com'
  AND c.status = 'active'
LIMIT 15;

-- Done!
DO $$
BEGIN
  RAISE NOTICE '
✅ DEMO DATA LOADED!

You can now login with:
Email: demo@example.com
Password: demo123
';
END $$;