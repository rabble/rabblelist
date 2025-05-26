-- Migration to change contacts table from first_name/last_name to full_name

-- Add the full_name column
ALTER TABLE contacts ADD COLUMN full_name TEXT;

-- Populate full_name from existing data
UPDATE contacts 
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL;

-- Make full_name NOT NULL after populating
ALTER TABLE contacts ALTER COLUMN full_name SET NOT NULL;

-- Drop the old columns
ALTER TABLE contacts DROP COLUMN first_name;
ALTER TABLE contacts DROP COLUMN last_name;

-- Update any views or functions that might reference these columns
-- (none found in the current schema)