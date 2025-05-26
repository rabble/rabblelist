-- Demo data setup (run AFTER creating demo@example.com user in Auth)
-- This creates the demo organization and links the demo user to it

-- First, create a demo organization
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
  gen_random_uuid(),
  'Demo Organization',
  'US',
  '{"demo": true}'::jsonb,
  '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- The user profile will be created automatically by the trigger when you create the auth user
-- But we need to update it to be an admin and link to the demo org
UPDATE users 
SET 
  role = 'admin',
  organization_id = (SELECT id FROM organizations WHERE name = 'Demo Organization' LIMIT 1),
  settings = '{"demo": true}'::jsonb
WHERE email = 'demo@example.com';

-- Add demo contacts
INSERT INTO contacts (organization_id, first_name, last_name, email, phone, status, tags, custom_fields, created_by, source, engagement_score)
SELECT 
  (SELECT id FROM organizations WHERE name = 'Demo Organization' LIMIT 1),
  first_name, last_name, email, phone, status, tags::text[], custom_fields, 
  (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
  source, engagement_score
FROM (VALUES 
  ('John', 'Doe', 'john.doe@example.com', '+1234567890', 'active', ARRAY['prospect', 'high-value'], '{"company": "Acme Corp", "position": "CEO"}'::jsonb, 'manual', 85),
  ('Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'active', ARRAY['customer'], '{"company": "Tech Solutions", "position": "CTO"}'::jsonb, 'import', 92),
  ('Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'active', ARRAY['lead'], '{"company": "StartupXYZ", "position": "Founder"}'::jsonb, 'manual', 67),
  ('Alice', 'Williams', 'alice.williams@example.com', '+1234567893', 'inactive', ARRAY['past-customer'], '{"company": "Global Inc", "position": "VP Sales"}'::jsonb, 'import', 45),
  ('Charlie', 'Brown', 'charlie.brown@example.com', '+1234567894', 'active', ARRAY['prospect', 'warm-lead'], '{"company": "Innovation Labs", "position": "Director"}'::jsonb, 'api', 78)
) AS c(first_name, last_name, email, phone, status, tags, custom_fields, source, engagement_score);

-- Add demo events  
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, settings, tags, created_by, is_published, registration_required)
SELECT
  (SELECT id FROM organizations WHERE name = 'Demo Organization' LIMIT 1),
  name, description, event_date, event_type, location, capacity, settings, tags::text[],
  (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
  is_published, registration_required
FROM (VALUES
  ('Product Launch Webinar', 'Join us for our exciting new product launch', NOW() + INTERVAL '7 days', 'webinar', 'Online', 500, '{"platform": "Zoom"}'::jsonb, ARRAY['product', 'launch'], true, true),
  ('Customer Success Workshop', 'Learn best practices for customer success', NOW() + INTERVAL '14 days', 'workshop', '123 Main St, New York, NY', 50, '{"catering": true}'::jsonb, ARRAY['training', 'customers'], true, true),
  ('Annual Conference', 'Our biggest event of the year', NOW() + INTERVAL '30 days', 'conference', 'Convention Center, San Francisco, CA', 1000, '{"multi_day": true}'::jsonb, ARRAY['annual', 'networking'], true, true)
) AS e(name, description, event_date, event_type, location, capacity, settings, tags, is_published, registration_required);

-- Add demo groups
INSERT INTO groups (organization_id, name, description, member_count, settings, tags, created_by, is_active, group_type)
SELECT
  (SELECT id FROM organizations WHERE name = 'Demo Organization' LIMIT 1),
  name, description, member_count, settings, tags::text[],
  (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
  is_active, group_type
FROM (VALUES
  ('VIP Customers', 'Our most valuable customers', 25, '{"benefits": ["priority support", "early access"]}'::jsonb, ARRAY['vip', 'customers'], true, 'customer_segment'),
  ('Beta Testers', 'Users testing new features', 50, '{"access_level": "beta"}'::jsonb, ARRAY['beta', 'testing'], true, 'program'),
  ('Newsletter Subscribers', 'Monthly newsletter recipients', 500, '{"frequency": "monthly"}'::jsonb, ARRAY['marketing', 'newsletter'], true, 'mailing_list')
) AS g(name, description, member_count, settings, tags, is_active, group_type);