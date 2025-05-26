-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️
-- Go to: https://supabase.com/dashboard/project/oxtjonaiubulnggytezf/sql/new
-- Paste this entire file and click "Run"

-- This fixes the schema mismatch between the database (first_name/last_name) 
-- and the app (full_name)

BEGIN;

-- Step 1: Add full_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'full_name') THEN
        ALTER TABLE contacts ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Step 2: Populate full_name from existing first_name and last_name
UPDATE contacts 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL;

-- Step 3: Make full_name NOT NULL
ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL;

-- Step 4: Drop the old columns if they exist
ALTER TABLE contacts DROP COLUMN IF EXISTS first_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS last_name;

COMMIT;

-- Verify the change worked
SELECT 'Schema fixed! Here are some sample contacts:' as message;
SELECT id, full_name, email, phone FROM contacts LIMIT 5;