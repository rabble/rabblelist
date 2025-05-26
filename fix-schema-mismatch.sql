-- FIX THE SCHEMA MISMATCH - APP EXPECTS full_name BUT DB HAS first_name/last_name

-- Add full_name column to contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Populate full_name from first_name and last_name
UPDATE contacts 
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL;

-- Make full_name NOT NULL after populating
ALTER TABLE contacts 
ALTER COLUMN full_name SET NOT NULL;

-- Drop the old columns if they exist
ALTER TABLE contacts 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;

-- Check the result
SELECT 'Fixed! Contacts now have full_name:' as status;
SELECT id, full_name, phone, email, tags FROM contacts LIMIT 5;