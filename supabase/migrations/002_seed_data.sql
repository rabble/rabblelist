-- Seed Data for Contact Manager PWA
-- This includes demo organization and demo user data

-- Create demo organization
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo Organization',
  'US',
  '{"demo": true}'::jsonb,
  '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}'::jsonb
);

-- Note: After running this migration, create the demo user in Supabase Auth:
-- Email: demo@example.com
-- Password: demo123
-- Auto Confirm Email: ✓

-- The user profile will be created automatically by the trigger
-- Then run this to make the demo user an admin:
UPDATE users 
SET 
  role = 'admin',
  organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  settings = '{"demo": true}'::jsonb,
  phone = '+1234567890'
WHERE email = 'demo@example.com';

-- Add demo contacts (will need to update created_by after demo user exists)
INSERT INTO contacts (organization_id, first_name, last_name, email, phone, status, tags, custom_fields, source, engagement_score)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'active', ARRAY['prospect', 'high-value'], '{"company": "Acme Corp", "position": "CEO"}'::jsonb, 'manual', 85),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'active', ARRAY['customer'], '{"company": "Tech Solutions", "position": "CTO"}'::jsonb, 'import', 92),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'active', ARRAY['lead'], '{"company": "StartupXYZ", "position": "Founder"}'::jsonb, 'manual', 67),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice', 'Williams', 'alice.williams@example.com', '+1234567893', 'inactive', ARRAY['past-customer'], '{"company": "Global Inc", "position": "VP Sales"}'::jsonb, 'import', 45),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Charlie', 'Brown', 'charlie.brown@example.com', '+1234567894', 'active', ARRAY['prospect', 'warm-lead'], '{"company": "Innovation Labs", "position": "Director"}'::jsonb, 'api', 78),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Diana', 'Davis', 'diana.davis@example.com', '+1234567895', 'active', ARRAY['customer', 'vip'], '{"company": "Enterprise Co", "position": "CFO"}'::jsonb, 'manual', 95),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Edward', 'Evans', 'edward.evans@example.com', '+1234567896', 'active', ARRAY['lead', 'newsletter'], '{"company": "Small Biz LLC", "position": "Owner"}'::jsonb, 'import', 55),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fiona', 'Foster', 'fiona.foster@example.com', '+1234567897', 'active', ARRAY['prospect'], '{"company": "Design Studio", "position": "Creative Director"}'::jsonb, 'api', 72),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'George', 'Green', 'george.green@example.com', '+1234567898', 'inactive', ARRAY['past-customer'], '{"company": "Retail Chain", "position": "Head of Purchasing"}'::jsonb, 'manual', 38),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Helen', 'Harris', 'helen.harris@example.com', '+1234567899', 'active', ARRAY['customer', 'referral'], '{"company": "Consulting Group", "position": "Partner"}'::jsonb, 'referral', 88);

-- Update created_by for contacts after demo user is created
UPDATE contacts 
SET created_by = (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1)
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND created_by IS NULL;

-- Add demo events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, settings, tags, is_published, registration_required)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Product Launch Webinar', 'Join us for our exciting new product launch', NOW() + INTERVAL '7 days', 'webinar', 'Online', 500, '{"platform": "Zoom", "recording_available": true}'::jsonb, ARRAY['product', 'launch'], true, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Customer Success Workshop', 'Learn best practices for customer success', NOW() + INTERVAL '14 days', 'workshop', '123 Main St, New York, NY', 50, '{"catering": true, "materials_provided": true}'::jsonb, ARRAY['training', 'customers'], true, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Annual Conference', 'Our biggest event of the year', NOW() + INTERVAL '30 days', 'conference', 'Convention Center, San Francisco, CA', 1000, '{"multi_day": true, "hotel_block": true}'::jsonb, ARRAY['annual', 'networking'], true, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sales Team Training', 'Internal training for sales team', NOW() + INTERVAL '3 days', 'training', 'Office Conference Room', 20, '{"internal": true}'::jsonb, ARRAY['training', 'internal'], false, false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Partner Meeting', 'Quarterly partner sync', NOW() + INTERVAL '21 days', 'meeting', 'Downtown Hotel', 30, '{"catering": true}'::jsonb, ARRAY['partners', 'quarterly'], true, true);

-- Update created_by for events after demo user is created
UPDATE events 
SET created_by = (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1)
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND created_by IS NULL;

-- Add demo groups
INSERT INTO groups (organization_id, name, description, member_count, settings, tags, is_active, group_type)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'VIP Customers', 'Our most valuable customers', 3, '{"benefits": ["priority support", "early access", "exclusive events"]}'::jsonb, ARRAY['vip', 'customers'], true, 'customer_segment'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beta Testers', 'Users testing new features', 5, '{"access_level": "beta", "feedback_required": true}'::jsonb, ARRAY['beta', 'testing'], true, 'program'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Newsletter Subscribers', 'Monthly newsletter recipients', 8, '{"frequency": "monthly", "topics": ["product updates", "industry news"]}'::jsonb, ARRAY['marketing', 'newsletter'], true, 'mailing_list'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Event Alumni', 'Past event attendees', 6, '{"event_history": true}'::jsonb, ARRAY['events', 'engagement'], true, 'engagement'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Referral Partners', 'Partners who refer business', 4, '{"commission_eligible": true}'::jsonb, ARRAY['partners', 'referral'], true, 'partner');

-- Update created_by for groups after demo user is created
UPDATE groups 
SET created_by = (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1)
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND created_by IS NULL;

-- Add members to groups (linking contacts to groups)
-- VIP Customers group
INSERT INTO group_members (group_id, contact_id)
SELECT 
  (SELECT id FROM groups WHERE name = 'VIP Customers' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  id
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND email IN ('jane.smith@example.com', 'diana.davis@example.com', 'helen.harris@example.com');

-- Beta Testers group
INSERT INTO group_members (group_id, contact_id)
SELECT 
  (SELECT id FROM groups WHERE name = 'Beta Testers' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  id
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND email IN ('john.doe@example.com', 'jane.smith@example.com', 'bob.johnson@example.com', 'charlie.brown@example.com', 'fiona.foster@example.com');

-- Newsletter Subscribers group (most contacts)
INSERT INTO group_members (group_id, contact_id)
SELECT 
  (SELECT id FROM groups WHERE name = 'Newsletter Subscribers' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  id
FROM contacts 
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND status = 'active';

-- Add some event registrations
INSERT INTO event_registrations (event_id, contact_id, status)
SELECT 
  e.id,
  c.id,
  CASE 
    WHEN random() < 0.8 THEN 'registered'
    ELSE 'cancelled'
  END
FROM events e
CROSS JOIN contacts c
WHERE e.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND e.is_published = true
  AND c.status = 'active'
  AND random() < 0.5; -- Only register ~50% of active contacts to each event

-- Add some sample interactions
INSERT INTO contact_interactions (contact_id, user_id, type, direction, status, duration, notes)
SELECT 
  c.id,
  u.id,
  CASE floor(random() * 4)
    WHEN 0 THEN 'call'
    WHEN 1 THEN 'email'
    WHEN 2 THEN 'meeting'
    ELSE 'note'
  END,
  CASE 
    WHEN floor(random() * 2) = 0 THEN 'inbound'
    ELSE 'outbound'
  END,
  'completed',
  CASE 
    WHEN floor(random() * 4) = 0 THEN floor(random() * 600 + 30) -- Call duration 30-630 seconds
    ELSE NULL
  END,
  CASE floor(random() * 5)
    WHEN 0 THEN 'Discussed product features and pricing'
    WHEN 1 THEN 'Follow-up on previous conversation'
    WHEN 2 THEN 'Scheduled demo for next week'
    WHEN 3 THEN 'Customer requested more information'
    ELSE 'General check-in call'
  END
FROM contacts c
CROSS JOIN users u
WHERE c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND u.email = 'demo@example.com'
  AND random() < 0.3; -- Create interactions for ~30% of contacts

-- Create a sample pathway
INSERT INTO pathways (organization_id, name, description, is_active, settings, tags)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Customer Onboarding',
  'Standard onboarding process for new customers',
  true,
  '{"estimated_duration_days": 30}'::jsonb,
  ARRAY['onboarding', 'customers']
);

-- Add pathway steps
INSERT INTO pathway_steps (pathway_id, name, description, order_index, step_type, settings, is_required)
SELECT
  (SELECT id FROM pathways WHERE name = 'Customer Onboarding' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  step_name,
  step_desc,
  step_order,
  step_type,
  settings,
  is_required
FROM (VALUES
  ('Welcome Call', 'Initial welcome call to introduce the team', 1, 'call', '{"duration_minutes": 30}'::jsonb, true),
  ('Account Setup', 'Help customer set up their account', 2, 'task', '{"assignee": "support_team"}'::jsonb, true),
  ('Product Training', 'Comprehensive product training session', 3, 'meeting', '{"duration_minutes": 60}'::jsonb, true),
  ('Follow-up Check', 'Check in after one week', 4, 'call', '{"duration_minutes": 15}'::jsonb, false),
  ('Success Review', '30-day success review', 5, 'meeting', '{"duration_minutes": 45}'::jsonb, true)
) AS steps(step_name, step_desc, step_order, step_type, settings, is_required);

-- Update created_by for pathways after demo user is created
UPDATE pathways 
SET created_by = (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1)
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND created_by IS NULL;

-- Final instructions
DO $$
BEGIN
  RAISE NOTICE '
=================================================================
IMPORTANT: Demo User Setup Required
=================================================================
To complete the demo setup:

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with:
   - Email: demo@example.com
   - Password: demo123
   - Auto Confirm Email: ✓ (check this box)
3. The demo data is now ready to use!

The demo account includes:
- 10 sample contacts with various tags and statuses
- 5 upcoming events (3 public, 2 internal)
- 5 different groups with members
- Sample interactions and event registrations
- 1 customer onboarding pathway with 5 steps
=================================================================
';
END $$;