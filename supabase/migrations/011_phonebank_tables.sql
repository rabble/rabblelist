-- Phone banking sessions
CREATE TABLE phonebank_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    calls_made INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in seconds
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Only one active session per user
    UNIQUE(user_id, status) WHERE status = 'active'
);

-- Phone banking calls
CREATE TABLE phonebank_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES phonebank_sessions(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'calling', 'connected', 'completed', 
        'failed', 'no_answer', 'busy', 'voicemail'
    )),
    outcome TEXT CHECK (outcome IN (
        'supporter', 'undecided', 'opposed', 
        'wrong_number', 'do_not_call', 'callback'
    )),
    duration INTEGER, -- in seconds
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Phone banking scripts
CREATE TABLE phonebank_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    questions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(campaign_id) -- One script per campaign
);

-- Indexes
CREATE INDEX idx_phonebank_sessions_campaign ON phonebank_sessions(campaign_id);
CREATE INDEX idx_phonebank_sessions_user ON phonebank_sessions(user_id);
CREATE INDEX idx_phonebank_sessions_status ON phonebank_sessions(status);
CREATE INDEX idx_phonebank_calls_session ON phonebank_calls(session_id);
CREATE INDEX idx_phonebank_calls_contact ON phonebank_calls(contact_id);
CREATE INDEX idx_phonebank_calls_status ON phonebank_calls(status);
CREATE INDEX idx_phonebank_scripts_campaign ON phonebank_scripts(campaign_id);

-- RLS Policies
ALTER TABLE phonebank_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonebank_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonebank_scripts ENABLE ROW LEVEL SECURITY;

-- Phone banking sessions policies
CREATE POLICY "Users can view phone banking sessions for their campaigns"
    ON phonebank_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organization_members om ON om.organization_id = c.organization_id
            WHERE c.id = phonebank_sessions.campaign_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own phone banking sessions"
    ON phonebank_sessions FOR ALL
    USING (user_id = auth.uid());

-- Phone banking calls policies
CREATE POLICY "Users can view calls for their sessions"
    ON phonebank_calls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM phonebank_sessions ps
            WHERE ps.id = phonebank_calls.session_id
            AND (
                ps.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM campaigns c
                    JOIN organization_members om ON om.organization_id = c.organization_id
                    WHERE c.id = ps.campaign_id
                    AND om.user_id = auth.uid()
                    AND om.role IN ('admin', 'organizer')
                )
            )
        )
    );

CREATE POLICY "Users can manage calls in their sessions"
    ON phonebank_calls FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM phonebank_sessions ps
            WHERE ps.id = phonebank_calls.session_id
            AND ps.user_id = auth.uid()
        )
    );

-- Phone banking scripts policies
CREATE POLICY "Users can view scripts for their campaigns"
    ON phonebank_scripts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organization_members om ON om.organization_id = c.organization_id
            WHERE c.id = phonebank_scripts.campaign_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and organizers can manage scripts"
    ON phonebank_scripts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organization_members om ON om.organization_id = c.organization_id
            WHERE c.id = phonebank_scripts.campaign_id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'organizer')
        )
    );

-- Function to update session stats
CREATE OR REPLACE FUNCTION update_phonebank_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.duration IS NOT NULL THEN
        UPDATE phonebank_sessions
        SET 
            calls_made = calls_made + 1,
            total_duration = total_duration + NEW.duration
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_stats_on_call_complete
    AFTER UPDATE OF status ON phonebank_calls
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_phonebank_session_stats();