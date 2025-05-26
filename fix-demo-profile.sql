-- FIX THE DEMO USER PROFILE

-- Update the existing demo user profile to ensure it has the right data
UPDATE users 
SET 
    full_name = 'Demo User',
    organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    role = 'admin',
    settings = '{"demo": true}'::jsonb,
    phone = '+1234567890',
    last_active = NOW(),
    updated_at = NOW()
WHERE email = 'demo@example.com';

-- If no rows were updated, create it
INSERT INTO users (
    id,
    email,
    full_name,
    organization_id,
    role,
    settings,
    phone,
    last_active,
    created_at,
    updated_at
)
SELECT 
    id,
    'demo@example.com',
    'Demo User',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'admin',
    '{"demo": true}'::jsonb,
    '+1234567890',
    NOW(),
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'demo@example.com'
ON CONFLICT (id) DO NOTHING;

-- Show the result
SELECT * FROM users WHERE email = 'demo@example.com';