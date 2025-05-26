-- Fix contacts table to use full_name instead of first_name/last_name
-- Run this in Supabase SQL Editor

BEGIN;

-- First check if we already have full_name column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'full_name') THEN
        -- Add the full_name column
        ALTER TABLE contacts ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Populate full_name from existing first_name and last_name
UPDATE contacts 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL;

-- Make full_name NOT NULL
ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL;

-- Drop the old columns if they exist
ALTER TABLE contacts DROP COLUMN IF EXISTS first_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS last_name;

COMMIT;

-- Verify the change
SELECT id, full_name, email, phone FROM contacts LIMIT 5;