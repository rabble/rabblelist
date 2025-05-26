-- Create the organization_id function that the app expects
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id 
  FROM users 
  WHERE id = auth.uid()
$$;