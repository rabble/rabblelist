-- Seed data for testing
-- Run this after setting up the schema and RLS policies

-- Create a test organization
INSERT INTO organizations (id, name, country_code, features)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Test Organization',
    'US',
    '{"calling": true, "events": true, "imports": true}'::jsonb
);

-- Note: You'll need to create users through Supabase Auth first,
-- then insert their records here. For now, here's a template:

-- INSERT INTO users (id, organization_id, email, full_name, role)
-- VALUES (
--     'YOUR-AUTH-USER-ID', -- Get this from auth.users after signing up
--     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
--     'admin@example.com',
--     'Admin User',
--     'admin'
-- );

-- Insert test contacts
INSERT INTO contacts (organization_id, full_name, phone, email, tags, total_events_attended, last_contact_date)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John Smith', '+1 (555) 123-4567', 'john.smith@example.com', ARRAY['volunteer', 'donor'], 3, NOW() - INTERVAL '7 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah Johnson', '+1 (555) 234-5678', 'sarah.j@example.com', ARRAY['volunteer'], 1, NOW() - INTERVAL '14 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Michael Brown', '+1 (555) 345-6789', null, ARRAY['donor', 'member'], 0, null),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emily Davis', '+1 (555) 456-7890', 'emily.davis@example.com', ARRAY['volunteer', 'member'], 5, NOW() - INTERVAL '30 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Robert Wilson', '+1 (555) 567-8901', null, ARRAY['prospect'], 0, null),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maria Garcia', '+1 (555) 678-9012', 'maria.g@example.com', ARRAY['volunteer', 'donor'], 8, NOW() - INTERVAL '3 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'David Lee', '+1 (555) 789-0123', 'david.lee@example.com', ARRAY['member'], 2, NOW() - INTERVAL '45 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jennifer Martinez', '+1 (555) 890-1234', null, ARRAY['volunteer'], 4, NOW() - INTERVAL '10 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'William Anderson', '+1 (555) 901-2345', 'w.anderson@example.com', ARRAY['donor'], 1, NOW() - INTERVAL '60 days'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lisa Thompson', '+1 (555) 012-3456', 'lisa.t@example.com', ARRAY['volunteer', 'member'], 6, NOW() - INTERVAL '5 days');

-- Insert test events
INSERT INTO events (organization_id, name, description, location, start_time, end_time)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Community Outreach Event', 'Monthly community gathering', '123 Main St, Anytown USA', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Volunteer Training', 'New volunteer orientation', 'Community Center', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fundraising Gala', 'Annual fundraising event', 'Grand Hotel Ballroom', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '4 hours');

-- Function to create user record after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, organization_id, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Default to test organization
        'ringer' -- Default role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();