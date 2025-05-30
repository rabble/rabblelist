-- Add recurring event support to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS occurrence_date DATE;

-- Create index for parent_event_id for performance
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_occurrence_date ON events(occurrence_date);

-- Recurrence rule structure:
-- {
--   "frequency": "daily" | "weekly" | "monthly" | "yearly",
--   "interval": 1,  // Every N days/weeks/months/years
--   "daysOfWeek": [0,1,2,3,4,5,6],  // 0=Sunday, 6=Saturday (for weekly)
--   "dayOfMonth": 15,  // For monthly (1-31)
--   "monthOfYear": 3,  // For yearly (1-12)
--   "endType": "never" | "after" | "on",
--   "endAfterOccurrences": 10,  // For "after" end type
--   "endDate": "2025-12-31",  // For "on" end type
--   "exceptions": ["2025-07-04", "2025-12-25"]  // Dates to skip
-- }

-- Function to generate recurring event occurrences
CREATE OR REPLACE FUNCTION generate_recurring_events(
    parent_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS SETOF events AS $$
DECLARE
    parent_event events%ROWTYPE;
    recurrence JSONB;
    current_date TIMESTAMPTZ;
    occurrence_count INTEGER := 0;
    max_occurrences INTEGER;
    frequency TEXT;
    interval_value INTEGER;
    end_type TEXT;
    event_duration INTERVAL;
BEGIN
    -- Get parent event
    SELECT * INTO parent_event FROM events WHERE id = parent_id;
    IF NOT FOUND OR NOT parent_event.is_recurring OR parent_event.recurrence_rule IS NULL THEN
        RETURN;
    END IF;
    
    recurrence := parent_event.recurrence_rule;
    frequency := recurrence->>'frequency';
    interval_value := COALESCE((recurrence->>'interval')::INTEGER, 1);
    end_type := COALESCE(recurrence->>'endType', 'never');
    max_occurrences := COALESCE((recurrence->>'endAfterOccurrences')::INTEGER, 365); -- Default max
    
    -- Calculate event duration
    IF parent_event.end_time IS NOT NULL THEN
        event_duration := parent_event.end_time - parent_event.start_time;
    ELSE
        event_duration := INTERVAL '2 hours'; -- Default duration
    END IF;
    
    -- Set end date based on end type
    IF end_type = 'on' AND recurrence->>'endDate' IS NOT NULL THEN
        end_date := LEAST(end_date, (recurrence->>'endDate')::TIMESTAMPTZ);
    ELSIF end_date IS NULL THEN
        end_date := start_date + INTERVAL '1 year'; -- Default to 1 year
    END IF;
    
    current_date := parent_event.start_time;
    
    -- Generate occurrences
    WHILE current_date <= end_date AND (end_type != 'after' OR occurrence_count < max_occurrences) LOOP
        -- Skip if this date is in exceptions
        IF recurrence->'exceptions' IS NOT NULL AND 
           recurrence->'exceptions' @> to_jsonb(current_date::DATE::TEXT) THEN
            -- Skip this occurrence
        ELSIF current_date > parent_event.start_time THEN
            -- Create occurrence (skip the first one as it's the parent)
            parent_event.id := gen_random_uuid();
            parent_event.parent_event_id := parent_id;
            parent_event.start_time := current_date;
            parent_event.end_time := current_date + event_duration;
            parent_event.occurrence_date := current_date::DATE;
            parent_event.is_recurring := false; -- Occurrences are not recurring
            parent_event.recurrence_rule := NULL;
            parent_event.created_at := NOW();
            parent_event.updated_at := NOW();
            
            RETURN NEXT parent_event;
            occurrence_count := occurrence_count + 1;
        END IF;
        
        -- Calculate next occurrence
        CASE frequency
            WHEN 'daily' THEN
                current_date := current_date + (interval_value || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                current_date := current_date + (interval_value || ' weeks')::INTERVAL;
                -- TODO: Handle specific days of week
            WHEN 'monthly' THEN
                current_date := current_date + (interval_value || ' months')::INTERVAL;
                -- TODO: Handle specific day of month
            WHEN 'yearly' THEN
                current_date := current_date + (interval_value || ' years')::INTERVAL;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create all occurrences for a recurring event
CREATE OR REPLACE FUNCTION create_recurring_event_occurrences(parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
    occurrence events%ROWTYPE;
    count INTEGER := 0;
BEGIN
    -- Delete existing occurrences first
    DELETE FROM events WHERE parent_event_id = parent_id;
    
    -- Generate and insert new occurrences
    FOR occurrence IN SELECT * FROM generate_recurring_events(parent_id, NOW()::TIMESTAMPTZ) LOOP
        INSERT INTO events VALUES (occurrence.*);
        count := count + 1;
    END LOOP;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate occurrences when a recurring event is created/updated
CREATE OR REPLACE FUNCTION handle_recurring_event_change() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recurring AND NEW.recurrence_rule IS NOT NULL AND NEW.parent_event_id IS NULL THEN
        -- This is a parent recurring event
        PERFORM create_recurring_event_occurrences(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS recurring_event_trigger ON events;
CREATE TRIGGER recurring_event_trigger
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.is_recurring = true)
    EXECUTE FUNCTION handle_recurring_event_change();

-- Add RLS policies for recurring events
CREATE POLICY "Users can view recurring event occurrences" ON events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Comment for documentation
COMMENT ON COLUMN events.is_recurring IS 'Whether this event has a recurrence pattern';
COMMENT ON COLUMN events.recurrence_rule IS 'JSON object defining the recurrence pattern';
COMMENT ON COLUMN events.parent_event_id IS 'Reference to the parent event for occurrences';
COMMENT ON COLUMN events.occurrence_date IS 'The specific date for this occurrence';