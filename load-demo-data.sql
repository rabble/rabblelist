-- LOAD PROPER DEMO DATA FOR CONTACT MANAGER
-- This creates actual demo data so you can see the app working

-- First, ensure we have the demo user's org ID
DO $$
DECLARE
    demo_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    demo_user_id UUID;
BEGIN
    -- Get demo user ID
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';
    
    -- Clear existing demo data to start fresh
    DELETE FROM call_logs WHERE organization_id = demo_org_id;
    DELETE FROM event_participants WHERE event_id IN (SELECT id FROM events WHERE organization_id = demo_org_id);
    DELETE FROM group_members WHERE group_id IN (SELECT id FROM groups WHERE organization_id = demo_org_id);
    DELETE FROM contacts WHERE organization_id = demo_org_id;
    DELETE FROM events WHERE organization_id = demo_org_id;
    DELETE FROM groups WHERE organization_id = demo_org_id;
    
    -- INSERT CONTACTS (20 diverse contacts)
    INSERT INTO contacts (organization_id, full_name, phone, email, tags, created_at, last_contact_date, total_events_attended) VALUES
    (demo_org_id, 'John Smith', '+1 (555) 123-4567', 'john.smith@example.com', ARRAY['volunteer', 'donor'], NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days', 3),
    (demo_org_id, 'Sarah Johnson', '+1 (555) 234-5678', 'sarah.j@example.com', ARRAY['volunteer'], NOW() - INTERVAL '25 days', NOW() - INTERVAL '7 days', 1),
    (demo_org_id, 'Michael Brown', '+1 (555) 345-6789', 'michael.b@example.com', ARRAY['donor', 'member'], NOW() - INTERVAL '20 days', NOW() - INTERVAL '14 days', 5),
    (demo_org_id, 'Emily Davis', '+1 (555) 456-7890', 'emily.davis@example.com', ARRAY['volunteer', 'member'], NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day', 8),
    (demo_org_id, 'Robert Wilson', '+1 (555) 567-8901', NULL, ARRAY['prospect'], NOW() - INTERVAL '10 days', NULL, 0),
    (demo_org_id, 'Maria Garcia', '+1 (555) 678-9012', 'maria.g@example.com', ARRAY['volunteer', 'donor'], NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days', 12),
    (demo_org_id, 'David Lee', '+1 (555) 789-0123', 'david.lee@example.com', ARRAY['member'], NOW() - INTERVAL '60 days', NOW() - INTERVAL '21 days', 2),
    (demo_org_id, 'Jennifer Martinez', '+1 (555) 890-1234', NULL, ARRAY['volunteer'], NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 4),
    (demo_org_id, 'William Anderson', '+1 (555) 901-2345', 'w.anderson@example.com', ARRAY['donor'], NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days', 1),
    (demo_org_id, 'Lisa Thompson', '+1 (555) 012-3456', 'lisa.t@example.com', ARRAY['volunteer', 'member'], NOW() - INTERVAL '35 days', NOW() - INTERVAL '4 days', 6),
    (demo_org_id, 'James Taylor', '+1 (555) 123-5678', 'james.taylor@example.com', ARRAY['prospect', 'newsletter'], NOW() - INTERVAL '3 days', NULL, 0),
    (demo_org_id, 'Patricia White', '+1 (555) 234-6789', 'patricia.w@example.com', ARRAY['member', 'donor'], NOW() - INTERVAL '50 days', NOW() - INTERVAL '10 days', 7),
    (demo_org_id, 'Charles Harris', '+1 (555) 345-7890', NULL, ARRAY['volunteer'], NOW() - INTERVAL '40 days', NOW() - INTERVAL '15 days', 3),
    (demo_org_id, 'Nancy Martin', '+1 (555) 456-8901', 'nancy.m@example.com', ARRAY['prospect'], NOW() - INTERVAL '2 days', NULL, 0),
    (demo_org_id, 'Daniel Jackson', '+1 (555) 567-9012', 'daniel.j@example.com', ARRAY['member', 'volunteer'], NOW() - INTERVAL '75 days', NOW() - INTERVAL '8 days', 9);

    -- INSERT EVENTS (8 events - past and future)
    INSERT INTO events (id, organization_id, name, description, location, start_time, end_time, capacity, created_at) VALUES
    (gen_random_uuid(), demo_org_id, 'Community Outreach Drive', 'Monthly community outreach event', '123 Main St, Anytown USA', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 50, NOW() - INTERVAL '14 days'),
    (gen_random_uuid(), demo_org_id, 'Volunteer Training Workshop', 'Training session for new volunteers', 'Community Center, Room 201', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours', 30, NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), demo_org_id, 'Annual Fundraising Gala', 'Our biggest fundraising event of the year', 'Grand Hotel Ballroom', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '4 hours', 200, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), demo_org_id, 'Phone Banking Session', 'Weekly phone banking', 'Campaign HQ', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 20, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), demo_org_id, 'Donor Appreciation Lunch', 'Thank you event for major donors', 'Riverside Restaurant', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours', 40, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), demo_org_id, 'Canvassing Weekend', 'Door-to-door canvassing', 'Various Neighborhoods', NOW() + INTERVAL '10 days', NOW() + INTERVAL '11 days', 100, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), demo_org_id, 'Strategy Meeting', 'Planning session for Q2', 'Office Conference Room', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 15, NOW()),
    (gen_random_uuid(), demo_org_id, 'Volunteer Appreciation Party', 'Celebrating our amazing volunteers', 'Community Park Pavilion', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '3 hours', 75, NOW() - INTERVAL '40 days');

    -- INSERT GROUPS (5 different types)
    INSERT INTO groups (id, organization_id, name, description, group_type, is_active, created_at) VALUES
    (gen_random_uuid(), demo_org_id, 'VIP Donors', 'Major donors ($1000+)', 'donor_tier', true, NOW() - INTERVAL '180 days'),
    (gen_random_uuid(), demo_org_id, 'Active Volunteers', 'Volunteers who have participated in last 30 days', 'volunteer_status', true, NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), demo_org_id, 'Phone Bank Team', 'Regular phone banking volunteers', 'team', true, NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), demo_org_id, 'Newsletter Subscribers', 'Email newsletter recipients', 'mailing_list', true, NOW() - INTERVAL '200 days'),
    (gen_random_uuid(), demo_org_id, 'Board Members', 'Organization board members', 'leadership', true, NOW() - INTERVAL '365 days');

    -- INSERT CALL LOGS (30 recent calls)
    INSERT INTO call_logs (organization_id, contact_id, ringer_id, outcome, notes, duration_seconds, called_at, tags)
    SELECT 
        demo_org_id,
        c.id,
        demo_user_id,
        CASE (RANDOM() * 4)::INT 
            WHEN 0 THEN 'answered'
            WHEN 1 THEN 'voicemail'
            WHEN 2 THEN 'no_answer'
            WHEN 3 THEN 'answered'
            ELSE 'no_answer'
        END,
        CASE (RANDOM() * 4)::INT
            WHEN 0 THEN 'Great conversation, very supportive'
            WHEN 1 THEN 'Left voicemail about upcoming event'
            WHEN 2 THEN 'No answer, try again later'
            WHEN 3 THEN 'Interested in volunteering'
            ELSE NULL
        END,
        CASE 
            WHEN (RANDOM() * 4)::INT = 0 THEN (60 + RANDOM() * 300)::INT
            ELSE NULL
        END,
        NOW() - (RANDOM() * 30 || ' days')::INTERVAL,
        CASE 
            WHEN RANDOM() < 0.3 THEN ARRAY['follow-up']
            WHEN RANDOM() < 0.6 THEN ARRAY['positive']
            ELSE ARRAY[]::TEXT[]
        END
    FROM contacts c
    WHERE c.organization_id = demo_org_id
    ORDER BY RANDOM()
    LIMIT 30;

    -- Add participants to events
    INSERT INTO event_participants (event_id, contact_id, status, checked_in_at)
    SELECT 
        e.id,
        c.id,
        CASE 
            WHEN e.start_time < NOW() THEN 
                CASE WHEN RANDOM() < 0.8 THEN 'attended' ELSE 'no_show' END
            ELSE 
                CASE WHEN RANDOM() < 0.9 THEN 'registered' ELSE 'cancelled' END
        END,
        CASE 
            WHEN e.start_time < NOW() AND RANDOM() < 0.8 THEN e.start_time + (RANDOM() * 30 || ' minutes')::INTERVAL
            ELSE NULL
        END
    FROM events e
    CROSS JOIN contacts c
    WHERE e.organization_id = demo_org_id
    AND c.organization_id = demo_org_id
    AND RANDOM() < 0.3
    ON CONFLICT (event_id, contact_id) DO NOTHING;

    -- Add members to groups
    INSERT INTO group_members (group_id, contact_id)
    SELECT 
        g.id,
        c.id
    FROM groups g
    CROSS JOIN contacts c
    WHERE g.organization_id = demo_org_id
    AND c.organization_id = demo_org_id
    AND (
        (g.name = 'VIP Donors' AND 'donor' = ANY(c.tags) AND RANDOM() < 0.5) OR
        (g.name = 'Active Volunteers' AND 'volunteer' = ANY(c.tags) AND RANDOM() < 0.7) OR
        (g.name = 'Phone Bank Team' AND 'volunteer' = ANY(c.tags) AND RANDOM() < 0.3) OR
        (g.name = 'Newsletter Subscribers' AND RANDOM() < 0.8) OR
        (g.name = 'Board Members' AND RANDOM() < 0.1)
    )
    ON CONFLICT DO NOTHING;

    -- Update group member counts
    UPDATE groups g
    SET member_count = (
        SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id
    )
    WHERE g.organization_id = demo_org_id;

    RAISE NOTICE 'Demo data loaded successfully!';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 15 contacts with various tags';
    RAISE NOTICE '- 8 events (past and future)';
    RAISE NOTICE '- 5 groups with members';
    RAISE NOTICE '- 30 call logs';
    RAISE NOTICE '- Event participants';
END $$;

-- Show summary
SELECT 'Contacts:' as type, COUNT(*) as count FROM contacts WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
UNION ALL
SELECT 'Events:', COUNT(*) FROM events WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
UNION ALL
SELECT 'Groups:', COUNT(*) FROM groups WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
UNION ALL
SELECT 'Call Logs:', COUNT(*) FROM call_logs WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;