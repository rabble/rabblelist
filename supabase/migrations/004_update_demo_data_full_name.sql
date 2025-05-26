-- Update demo data to use full_name instead of first_name/last_name
-- This should be run AFTER fix-full-name.sql

-- Clear existing demo contacts (they have the wrong schema)
DELETE FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Re-insert demo contacts with full_name
INSERT INTO contacts (organization_id, full_name, email, phone, status, tags, custom_fields, source, engagement_score, created_by)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'John Doe', 'john.doe@example.com', '+1234567890', 'active', ARRAY['prospect', 'high-value'], '{"company": "Acme Corp", "position": "CEO"}'::jsonb, 'manual', 85, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Jane Smith', 'jane.smith@example.com', '+1234567891', 'active', ARRAY['customer'], '{"company": "Tech Solutions", "position": "CTO"}'::jsonb, 'import', 92, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Bob Johnson', 'bob.johnson@example.com', '+1234567892', 'active', ARRAY['lead'], '{"company": "StartupXYZ", "position": "Founder"}'::jsonb, 'manual', 67, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Alice Williams', 'alice.williams@example.com', '+1234567893', 'inactive', ARRAY['past-customer'], '{"company": "Global Inc", "position": "VP Sales"}'::jsonb, 'import', 45, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Charlie Brown', 'charlie.brown@example.com', '+1234567894', 'active', ARRAY['prospect', 'warm-lead'], '{"company": "Innovation Labs", "position": "Director"}'::jsonb, 'api', 78, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Diana Davis', 'diana.davis@example.com', '+1234567895', 'active', ARRAY['customer', 'vip'], '{"company": "Enterprise Co", "position": "CFO"}'::jsonb, 'manual', 95, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Edward Evans', 'edward.evans@example.com', '+1234567896', 'active', ARRAY['lead', 'newsletter'], '{"company": "Small Biz LLC", "position": "Owner"}'::jsonb, 'import', 55, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Fiona Foster', 'fiona.foster@example.com', '+1234567897', 'active', ARRAY['prospect'], '{"company": "Design Studio", "position": "Creative Director"}'::jsonb, 'api', 72, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'George Green', 'george.green@example.com', '+1234567898', 'inactive', ARRAY['past-customer'], '{"company": "Retail Chain", "position": "Head of Purchasing"}'::jsonb, 'manual', 38, (SELECT id FROM users WHERE email = 'demo@example.com')),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Helen Harris', 'helen.harris@example.com', '+1234567899', 'active', ARRAY['customer', 'referral'], '{"company": "Consulting Group", "position": "Partner"}'::jsonb, 'referral', 88, (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Re-add group members
INSERT INTO group_members (group_id, contact_id, added_by)
SELECT 
  (SELECT id FROM groups WHERE name = 'VIP Customers' LIMIT 1),
  id,
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  AND email IN ('jane.smith@example.com', 'diana.davis@example.com', 'helen.harris@example.com')
ON CONFLICT DO NOTHING;

-- Update group member counts
UPDATE groups SET member_count = (
  SELECT COUNT(*) FROM group_members WHERE group_id = groups.id
);

-- Re-add some interactions
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