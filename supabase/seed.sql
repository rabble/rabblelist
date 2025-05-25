-- =============================================
-- SEED DATA FOR CONTACT MANAGEMENT SYSTEM
-- Run this after the main schema migration
-- =============================================

-- Clear existing data (be careful in production!)
TRUNCATE TABLE contact_pathways CASCADE;
TRUNCATE TABLE pathways CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE call_assignments CASCADE;
TRUNCATE TABLE event_participants CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE call_logs CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- Create demo organization
INSERT INTO organizations (id, name, country_code, settings, features)
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'Progressive Action Network',
    'US',
    '{"timezone": "America/New_York", "calling_hours": {"start": "09:00", "end": "20:00"}}',
    '{"calling": true, "events": true, "imports": true, "groups": true, "pathways": true}'
);

-- Create demo users (you'll need to create auth users separately in Supabase Auth)
INSERT INTO users (id, organization_id, email, full_name, role, phone)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'admin@example.com', 'Admin User', 'admin', '+1234567890'),
    ('00000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ringer1@example.com', 'Jane Smith', 'ringer', '+1234567891'),
    ('00000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ringer2@example.com', 'John Doe', 'ringer', '+1234567892');

-- Create sample contacts
INSERT INTO contacts (organization_id, full_name, phone, email, tags, address, last_contact_date, total_events_attended)
VALUES 
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Sarah Johnson', '+1 (555) 123-4567', 'sarah.j@email.com', ARRAY['volunteer', 'donor'], '123 Main St, Anytown, ST 12345', NOW() - INTERVAL '7 days', 3),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Michael Chen', '+1 (555) 234-5678', 'mchen@email.com', ARRAY['volunteer'], '456 Oak Ave, Somewhere, ST 12346', NOW() - INTERVAL '14 days', 1),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Emily Rodriguez', '+1 (555) 345-6789', 'emily.r@email.com', ARRAY['donor', 'member'], '789 Pine Rd, Elsewhere, ST 12347', NOW() - INTERVAL '30 days', 5),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'David Kim', '+1 (555) 456-7890', null, ARRAY['prospect'], '321 Elm St, Anywhere, ST 12348', null, 0),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Lisa Thompson', '+1 (555) 567-8901', 'lisa.t@email.com', ARRAY['volunteer', 'member'], '654 Maple Dr, Nowhere, ST 12349', NOW() - INTERVAL '3 days', 8),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Robert Wilson', '+1 (555) 678-9012', 'rwilson@email.com', ARRAY['donor'], '987 Birch Ln, Someplace, ST 12340', NOW() - INTERVAL '60 days', 2),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Jennifer Martinez', '+1 (555) 789-0123', null, ARRAY['prospect'], '147 Cedar Ct, Anyplace, ST 12341', null, 0),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'William Brown', '+1 (555) 890-1234', 'wbrown@email.com', ARRAY['volunteer', 'donor', 'member'], '258 Spruce Way, Everytown, ST 12342', NOW() - INTERVAL '1 day', 12),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Maria Garcia', '+1 (555) 901-2345', 'mgarcia@email.com', ARRAY['volunteer'], '369 Willow St, Thistown, ST 12343', NOW() - INTERVAL '21 days', 4),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'James Taylor', '+1 (555) 012-3456', null, ARRAY['prospect', 'event_attendee'], '741 Ash Rd, Thattown, ST 12344', null, 1);

-- Create sample events
INSERT INTO events (id, organization_id, name, description, location, start_time, capacity, settings)
VALUES 
    ('e1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Weekly Phone Banking', 
     'Join us for our weekly phone banking session to reach out to supporters and mobilize our community.',
     'Virtual - Zoom Link will be provided',
     NOW() + INTERVAL '2 days',
     50,
     '{"requires_rsvp": true, "send_reminders": true}'
    ),
    ('e2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Community Town Hall', 
     'Monthly community meeting to discuss local issues and organize actions.',
     'Community Center, 123 Main St, Anytown, ST 12345',
     NOW() + INTERVAL '7 days',
     100,
     '{"requires_rsvp": true, "check_in_enabled": true}'
    ),
    ('e3000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Volunteer Training', 
     'New volunteer orientation and training session.',
     'Office, 456 Oak Ave, Somewhere, ST 12346',
     NOW() + INTERVAL '14 days',
     25,
     '{"requires_rsvp": true, "materials_provided": true}'
    );

-- Create sample groups
INSERT INTO groups (id, organization_id, name, description, settings)
VALUES 
    ('g1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Downtown Chapter', 'Local organizing group for downtown area', '{"meeting_day": "Tuesday", "meeting_time": "18:00"}'),
    ('g2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Student Coalition', 'University student organizing group', '{"campus": "State University", "meeting_location": "Student Union"}'),
    ('g3000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Senior Advocates', 'Organizing group focused on senior issues', '{"focus_areas": ["healthcare", "social_security"]}');

-- Create sample pathways
INSERT INTO pathways (id, organization_id, name, description, steps)
VALUES 
    ('p1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Volunteer Onboarding', 
     'Standard pathway for new volunteers',
     '[
       {"id": 1, "name": "Attend orientation", "description": "Attend new volunteer orientation session"},
       {"id": 2, "name": "Complete training", "description": "Complete required volunteer training"},
       {"id": 3, "name": "First action", "description": "Participate in first volunteer action"},
       {"id": 4, "name": "Join team", "description": "Join a regular volunteer team"},
       {"id": 5, "name": "Lead activity", "description": "Lead or co-lead a volunteer activity"}
     ]'
    ),
    ('p2000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
     'Leadership Development', 
     'Pathway for developing organizational leaders',
     '[
       {"id": 1, "name": "Active volunteer", "description": "Consistently volunteer for 3+ months"},
       {"id": 2, "name": "Team leader", "description": "Lead a volunteer team or project"},
       {"id": 3, "name": "Organizer training", "description": "Complete organizer training program"},
       {"id": 4, "name": "Lead campaign", "description": "Lead or co-lead a campaign"},
       {"id": 5, "name": "Mentor others", "description": "Mentor new volunteers or leaders"}
     ]'
    );

-- Assign some contacts to ringers
INSERT INTO call_assignments (organization_id, ringer_id, contact_id, priority)
SELECT 
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    '00000000-0000-0000-0000-000000000002', -- Jane Smith
    id,
    CASE 
        WHEN 'donor' = ANY(tags) THEN 1
        WHEN 'volunteer' = ANY(tags) THEN 2
        ELSE 3
    END as priority
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
ORDER BY last_contact_date ASC NULLS FIRST
LIMIT 5;

-- Add some more assignments for the other ringer
INSERT INTO call_assignments (organization_id, ringer_id, contact_id, priority)
SELECT 
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    '00000000-0000-0000-0000-000000000003', -- John Doe
    id,
    CASE 
        WHEN 'donor' = ANY(tags) THEN 1
        WHEN 'volunteer' = ANY(tags) THEN 2
        ELSE 3
    END as priority
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND id NOT IN (SELECT contact_id FROM call_assignments)
ORDER BY last_contact_date ASC NULLS FIRST
LIMIT 5;

-- Create some call history
INSERT INTO call_logs (organization_id, contact_id, ringer_id, outcome, notes, called_at)
SELECT 
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    id,
    '00000000-0000-0000-0000-000000000002',
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'answered'::text
        WHEN 1 THEN 'voicemail'::text
        ELSE 'no_answer'::text
    END,
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'Had a great conversation about upcoming events'
        WHEN 1 THEN 'Left voicemail about volunteer opportunities'
        ELSE null
    END,
    last_contact_date
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND last_contact_date IS NOT NULL;

-- Register some contacts for events
INSERT INTO event_participants (event_id, contact_id, status)
SELECT 
    'e1000000-0000-0000-0000-000000000001',
    id,
    'registered'
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND 'volunteer' = ANY(tags)
LIMIT 10;

INSERT INTO event_participants (event_id, contact_id, status)
SELECT 
    'e2000000-0000-0000-0000-000000000002',
    id,
    'registered'
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND 'member' = ANY(tags)
LIMIT 15;

-- Add some contacts to groups
INSERT INTO group_members (group_id, contact_id, role)
SELECT 
    'g1000000-0000-0000-0000-000000000001',
    id,
    CASE WHEN 'volunteer' = ANY(tags) AND 'member' = ANY(tags) THEN 'coordinator' ELSE 'member' END
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
LIMIT 8;

-- Start some contacts on pathways
INSERT INTO contact_pathways (contact_id, pathway_id, current_step, completed_steps)
SELECT 
    id,
    'p1000000-0000-0000-0000-000000000001',
    CASE 
        WHEN total_events_attended > 5 THEN 3
        WHEN total_events_attended > 2 THEN 2
        ELSE 1
    END,
    CASE 
        WHEN total_events_attended > 5 THEN '[1,2]'::jsonb
        WHEN total_events_attended > 2 THEN '[1]'::jsonb
        ELSE '[]'::jsonb
    END
FROM contacts
WHERE organization_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND 'volunteer' = ANY(tags)
LIMIT 5;

-- Grant necessary permissions for the application
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;