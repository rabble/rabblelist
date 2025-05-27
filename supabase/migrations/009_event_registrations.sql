-- Event registration tables
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Registration info
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
    registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Guest info (for non-contact registrations)
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    
    -- Registration details
    ticket_type TEXT DEFAULT 'general',
    ticket_price DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
    payment_id TEXT,
    
    -- Check-in info
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMPTZ,
    checked_in_by UUID REFERENCES auth.users(id),
    
    -- Additional fields
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique registration per contact per event
    UNIQUE(event_id, contact_id),
    -- Ensure unique guest email per event
    UNIQUE(event_id, guest_email)
);

-- Event capacity and waitlist management
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_types JSONB DEFAULT '[{"name": "general", "price": 0, "capacity": null}]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_registration_fields JSONB DEFAULT '[]';

-- Registration questions/custom fields
CREATE TABLE event_registration_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'radio', 'date')),
    field_label TEXT NOT NULL,
    field_options JSONB, -- For select/radio/checkbox options
    required BOOLEAN DEFAULT FALSE,
    field_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event registration stats view
CREATE OR REPLACE VIEW event_registration_stats AS
SELECT 
    e.id as event_id,
    e.organization_id,
    COUNT(DISTINCT CASE WHEN er.status = 'registered' THEN er.id END) as registered_count,
    COUNT(DISTINCT CASE WHEN er.status = 'waitlisted' THEN er.id END) as waitlist_count,
    COUNT(DISTINCT CASE WHEN er.status = 'attended' THEN er.id END) as attended_count,
    COUNT(DISTINCT CASE WHEN er.status = 'cancelled' THEN er.id END) as cancelled_count,
    COUNT(DISTINCT CASE WHEN er.checked_in = TRUE THEN er.id END) as checked_in_count,
    SUM(CASE WHEN er.payment_status = 'paid' THEN er.ticket_price ELSE 0 END) as total_revenue,
    MAX(er.registration_date) as last_registration
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.organization_id;

-- Indexes
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_contact_id ON event_registrations(contact_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_guest_email ON event_registrations(guest_email);

-- RLS policies
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_fields ENABLE ROW LEVEL SECURITY;

-- Users can view registrations for their organization's events
CREATE POLICY "Users can view their organization's event registrations"
    ON event_registrations FOR SELECT
    USING (organization_id IN (
        SELECT om.organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
    ));

-- Users can create registrations for their organization's events
CREATE POLICY "Users can create event registrations"
    ON event_registrations FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT om.organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
    ));

-- Users can update registrations for their organization's events
CREATE POLICY "Users can update their organization's event registrations"
    ON event_registrations FOR UPDATE
    USING (organization_id IN (
        SELECT om.organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
    ));

-- Public registration policy (anyone can register for public events)
CREATE POLICY "Public can register for public events"
    ON event_registrations FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT id FROM events 
            WHERE is_public = TRUE 
            AND registration_open = TRUE
            AND (registration_deadline IS NULL OR registration_deadline > NOW())
        )
    );

-- Registration fields policies
CREATE POLICY "Users can view registration fields"
    ON event_registration_fields FOR SELECT
    USING (event_id IN (
        SELECT e.id FROM events e
        JOIN organization_members om ON e.organization_id = om.organization_id
        WHERE om.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage registration fields"
    ON event_registration_fields FOR ALL
    USING (event_id IN (
        SELECT e.id FROM events e
        JOIN organization_members om ON e.organization_id = om.organization_id
        WHERE om.user_id = auth.uid()
    ));

-- Function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_registered INTEGER;
    event_capacity INTEGER;
    waitlist_on BOOLEAN;
BEGIN
    -- Only check for new registrations
    IF NEW.status = 'registered' THEN
        -- Get event capacity and settings
        SELECT max_capacity, waitlist_enabled INTO event_capacity, waitlist_on
        FROM events WHERE id = NEW.event_id;
        
        -- If no capacity limit, allow registration
        IF event_capacity IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Count current registrations
        SELECT COUNT(*) INTO current_registered
        FROM event_registrations
        WHERE event_id = NEW.event_id AND status = 'registered';
        
        -- Check capacity
        IF current_registered >= event_capacity THEN
            IF waitlist_on THEN
                NEW.status := 'waitlisted';
            ELSE
                RAISE EXCEPTION 'Event is at capacity';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_event_capacity_trigger
    BEFORE INSERT ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION check_event_capacity();

-- Function to auto-promote from waitlist
CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    next_waitlisted RECORD;
    event_capacity INTEGER;
    current_registered INTEGER;
BEGIN
    -- Only process cancellations
    IF OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
        -- Get event capacity
        SELECT max_capacity INTO event_capacity
        FROM events WHERE id = NEW.event_id;
        
        -- If no capacity limit, nothing to promote
        IF event_capacity IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Count current registrations
        SELECT COUNT(*) INTO current_registered
        FROM event_registrations
        WHERE event_id = NEW.event_id AND status = 'registered';
        
        -- If under capacity, promote next waitlisted
        IF current_registered < event_capacity THEN
            -- Get next person on waitlist
            SELECT * INTO next_waitlisted
            FROM event_registrations
            WHERE event_id = NEW.event_id AND status = 'waitlisted'
            ORDER BY registration_date
            LIMIT 1;
            
            -- Promote them
            IF FOUND THEN
                UPDATE event_registrations
                SET status = 'registered', updated_at = NOW()
                WHERE id = next_waitlisted.id;
                
                -- TODO: Send notification email
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promote_from_waitlist_trigger
    AFTER UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION promote_from_waitlist();

-- Update timestamp trigger
CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();