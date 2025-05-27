-- Update events table to match application code
ALTER TABLE events 
  RENAME COLUMN name TO title;

-- Rename event_date to start_time to match the service code
ALTER TABLE events 
  RENAME COLUMN event_date TO start_time;

-- Add end_time column
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- The existing capacity column is fine, we'll use it as max_capacity in the app

-- Update columns to be nullable where appropriate
ALTER TABLE events 
  ALTER COLUMN location DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);