-- Create demo user and organization
-- This migration creates a demo user with pre-populated data for testing

-- First, create a demo organization
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
  'demo-org-123',
  'Demo Organization',
  'US',
  '{"demo": true}'::jsonb,
  '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create demo user in auth.users (password: demo123)
-- Note: This needs to be run through Supabase dashboard or API
-- The password hash below is for 'demo123'
-- You'll need to create this user through the Supabase dashboard

-- Create demo user profile
INSERT INTO users (id, email, full_name, organization_id, role, settings, phone, last_active)
VALUES (
  'demo-user-456',
  'demo@example.com',
  'Demo User',
  'demo-org-123',
  'admin',
  '{"demo": true}'::jsonb,
  '+1234567890',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add demo contacts
INSERT INTO contacts (organization_id, first_name, last_name, email, phone, status, tags, custom_fields, created_by, source, engagement_score)
VALUES 
  ('demo-org-123', 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'active', ARRAY['prospect', 'high-value'], '{"company": "Acme Corp", "position": "CEO"}'::jsonb, 'demo-user-456', 'manual', 85),
  ('demo-org-123', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'active', ARRAY['customer'], '{"company": "Tech Solutions", "position": "CTO"}'::jsonb, 'demo-user-456', 'import', 92),
  ('demo-org-123', 'Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'active', ARRAY['lead'], '{"company": "StartupXYZ", "position": "Founder"}'::jsonb, 'demo-user-456', 'manual', 67),
  ('demo-org-123', 'Alice', 'Williams', 'alice.williams@example.com', '+1234567893', 'inactive', ARRAY['past-customer'], '{"company": "Global Inc", "position": "VP Sales"}'::jsonb, 'demo-user-456', 'import', 45),
  ('demo-org-123', 'Charlie', 'Brown', 'charlie.brown@example.com', '+1234567894', 'active', ARRAY['prospect', 'warm-lead'], '{"company": "Innovation Labs", "position": "Director"}'::jsonb, 'demo-user-456', 'api', 78)
ON CONFLICT DO NOTHING;

-- Add demo events
INSERT INTO events (organization_id, name, description, event_date, event_type, location, capacity, settings, tags, created_by, is_published, registration_required)
VALUES
  ('demo-org-123', 'Product Launch Webinar', 'Join us for our exciting new product launch', NOW() + INTERVAL '7 days', 'webinar', 'Online', 500, '{"platform": "Zoom"}'::jsonb, ARRAY['product', 'launch'], 'demo-user-456', true, true),
  ('demo-org-123', 'Customer Success Workshop', 'Learn best practices for customer success', NOW() + INTERVAL '14 days', 'workshop', '123 Main St, New York, NY', 50, '{"catering": true}'::jsonb, ARRAY['training', 'customers'], 'demo-user-456', true, true),
  ('demo-org-123', 'Annual Conference', 'Our biggest event of the year', NOW() + INTERVAL '30 days', 'conference', 'Convention Center, San Francisco, CA', 1000, '{"multi_day": true}'::jsonb, ARRAY['annual', 'networking'], 'demo-user-456', true, true)
ON CONFLICT DO NOTHING;

-- Add demo groups
INSERT INTO groups (organization_id, name, description, member_count, settings, tags, created_by, is_active, group_type)
VALUES
  ('demo-org-123', 'VIP Customers', 'Our most valuable customers', 25, '{"benefits": ["priority support", "early access"]}'::jsonb, ARRAY['vip', 'customers'], 'demo-user-456', true, 'customer_segment'),
  ('demo-org-123', 'Beta Testers', 'Users testing new features', 50, '{"access_level": "beta"}'::jsonb, ARRAY['beta', 'testing'], 'demo-user-456', true, 'program'),
  ('demo-org-123', 'Newsletter Subscribers', 'Monthly newsletter recipients', 500, '{"frequency": "monthly"}'::jsonb, ARRAY['marketing', 'newsletter'], 'demo-user-456', true, 'mailing_list')
ON CONFLICT DO NOTHING;

-- Note: To create the demo user in Supabase Auth:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Create user with email: demo@example.com, password: demo123
-- 3. Update the user ID in this script to match the created user
-- 4. Run this migration