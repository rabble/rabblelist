-- CREATE THE FUCKING DEMO USER PROFILE THAT SHOULD HAVE EXISTED FROM THE START

-- First, get the demo user's ID from auth.users
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get the demo user's ID
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@example.com' 
    LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'Demo user not found in auth.users! Create it first!';
    ELSE
        -- Delete any existing profile (in case of partial data)
        DELETE FROM users WHERE id = demo_user_id;
        
        -- Create the profile
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
        ) VALUES (
            demo_user_id,
            'demo@example.com',
            'Demo User',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
            'admin',
            '{"demo": true}'::jsonb,
            '+1234567890',
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Demo user profile created successfully! ID: %', demo_user_id;
    END IF;
END $$;

-- Verify it worked
SELECT * FROM users WHERE email = 'demo@example.com';