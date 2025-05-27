-- Petition signatures table
CREATE TABLE petition_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    zip_code TEXT,
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Prevent duplicate signatures per campaign
    UNIQUE(campaign_id, email)
);

-- Indexes
CREATE INDEX idx_petition_signatures_campaign ON petition_signatures(campaign_id);
CREATE INDEX idx_petition_signatures_signed_at ON petition_signatures(signed_at DESC);
CREATE INDEX idx_petition_signatures_email ON petition_signatures(email);
CREATE INDEX idx_petition_signatures_zip ON petition_signatures(zip_code) WHERE zip_code IS NOT NULL;

-- RLS Policies
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can sign a petition
CREATE POLICY "Public can create petition signatures"
    ON petition_signatures FOR INSERT
    WITH CHECK (true);

-- Anyone can view public signatures
CREATE POLICY "Public can view public petition signatures"
    ON petition_signatures FOR SELECT
    USING (is_public = true);

-- Organization members can view all signatures
CREATE POLICY "Organization members can view all signatures"
    ON petition_signatures FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organization_members om ON om.organization_id = c.organization_id
            WHERE c.id = petition_signatures.campaign_id
            AND om.user_id = auth.uid()
        )
    );

-- Function to update campaign stats on new signature
CREATE OR REPLACE FUNCTION update_campaign_stats_on_signature()
RETURNS TRIGGER AS $$
BEGIN
    -- Update participants and conversions count
    UPDATE campaign_stats
    SET 
        participants = participants + 1,
        conversions = conversions + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE campaign_id = NEW.campaign_id;
    
    -- If no stats exist, create them
    INSERT INTO campaign_stats (campaign_id, participants, conversions, shares, new_contacts)
    SELECT NEW.campaign_id, 1, 1, 0, 0
    WHERE NOT EXISTS (
        SELECT 1 FROM campaign_stats WHERE campaign_id = NEW.campaign_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_petition_signature
    AFTER INSERT ON petition_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats_on_signature();