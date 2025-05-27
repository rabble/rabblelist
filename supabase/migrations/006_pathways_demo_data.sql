-- Pathways and campaigns demo data for organizing and engagement
-- Run this AFTER 005_events_demo_data.sql

-- Clear any existing demo pathways
DELETE FROM pathway_steps WHERE pathway_id IN (SELECT id FROM pathways WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);
DELETE FROM pathways WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Insert organizing pathways
INSERT INTO pathways (organization_id, name, description, pathway_type, status, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'New Volunteer Onboarding', 'Standard pathway for onboarding new volunteers into active participation', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Prospect to Activist', 'Convert interested community members into active organizers', 'engagement', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Donor Cultivation', 'Build relationships with potential major donors', 'fundraising', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Leadership Development', 'Develop volunteers into campaign leaders and organizers', 'leadership', 'active', (SELECT id FROM users WHERE email = 'demo@example.com')),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Re-engagement Campaign', 'Win back inactive supporters and past volunteers', 'reactivation', 'active', (SELECT id FROM users WHERE email = 'demo@example.com'));

-- Add steps for New Volunteer Onboarding
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'Welcome Email', 'Send welcome email with mission and values', 
  'action', 'immediate', NULL, 'email', 
  '{"template": "welcome_volunteer", "subject": "Welcome to the movement!"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Orientation Invite', 'Invite to next volunteer orientation session', 
  'action', 'delay', '{"days": 2}', 'task', 
  '{"task": "Send orientation session invite", "priority": "high"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Check-in Call', 'Personal call to welcome and answer questions', 
  'action', 'delay', '{"days": 7}', 'call', 
  '{"script": "Welcome check-in", "duration": 15}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 4, 'First Action', 'Invite to easy first volunteer action', 
  'action', 'delay', '{"days": 14}', 'email', 
  '{"template": "first_action", "subject": "Ready for your first action?"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'New Volunteer Onboarding' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Add steps for Prospect to Activist
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'Issue Survey', 'Send survey about issues they care about', 
  'action', 'immediate', NULL, 'email', 
  '{"template": "issue_survey", "subject": "What issues matter to you?"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Prospect to Activist' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Event Invitation', 'Invite to relevant event based on interests', 
  'action', 'delay', '{"days": 7}', 'task', 
  '{"task": "Send personalized event invite based on survey responses"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Prospect to Activist' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Follow-up Call', 'Call to build relationship and encourage participation', 
  'action', 'delay', '{"days": 14}', 'call', 
  '{"script": "Prospect follow-up", "duration": 20}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Prospect to Activist' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Add steps for Donor Cultivation
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'Thank You Call', 'Personal thank you from organizer', 
  'action', 'immediate', NULL, 'call', 
  '{"script": "Donor thank you", "duration": 10}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Donor Cultivation' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Impact Report', 'Send report showing impact of their donation', 
  'action', 'delay', '{"days": 30}', 'email', 
  '{"template": "donor_impact", "subject": "Your impact this month"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Donor Cultivation' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Major Donor Event', 'Invite to exclusive donor appreciation event', 
  'action', 'delay', '{"days": 60}', 'task', 
  '{"task": "Send major donor event invitation", "priority": "high"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Donor Cultivation' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Add steps for Leadership Development
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'Leadership Assessment', 'Identify leadership potential and interests', 
  'action', 'immediate', NULL, 'meeting', 
  '{"type": "one-on-one", "agenda": "Leadership potential discussion"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Leadership Development' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Shadow Opportunity', 'Shadow experienced organizer at event', 
  'action', 'delay', '{"days": 7}', 'task', 
  '{"task": "Arrange shadowing opportunity at next major event"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Leadership Development' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Lead First Action', 'Support them in leading their first action/event', 
  'action', 'delay', '{"days": 30}', 'task', 
  '{"task": "Assign leadership role in upcoming action", "priority": "high"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Leadership Development' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Add steps for Re-engagement Campaign
INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 1, 'We Miss You Email', 'Friendly email acknowledging their past involvement', 
  'action', 'immediate', NULL, 'email', 
  '{"template": "re_engagement", "subject": "We miss you!"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Re-engagement Campaign' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 2, 'Update Call', 'Call to update them on recent wins and current campaigns', 
  'action', 'delay', '{"days": 7}', 'call', 
  '{"script": "Re-engagement update", "duration": 15}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Re-engagement Campaign' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

INSERT INTO pathway_steps (pathway_id, step_order, name, description, step_type, trigger_type, trigger_value, action_type, action_value, created_by)
SELECT 
  id, 3, 'Easy Re-entry', 'Offer low-commitment way to get involved again', 
  'action', 'delay', '{"days": 14}', 'email', 
  '{"template": "easy_action", "subject": "Just one hour can make a difference"}',
  (SELECT id FROM users WHERE email = 'demo@example.com')
FROM pathways WHERE name = 'Re-engagement Campaign' AND organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;