-- Communication logs for tracking email, SMS, and other communications
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'call', 'push')),
    recipients TEXT[] NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Scheduled communications
CREATE TABLE scheduled_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'call', 'push')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    recipients TEXT[] NOT NULL,
    content JSONB NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- SMS Templates
CREATE TABLE sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(organization_id, name)
);

-- Indexes
CREATE INDEX idx_communication_logs_organization ON communication_logs(organization_id);
CREATE INDEX idx_communication_logs_campaign ON communication_logs(campaign_id);
CREATE INDEX idx_communication_logs_type ON communication_logs(type);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at DESC);
CREATE INDEX idx_scheduled_communications_scheduled_for ON scheduled_communications(scheduled_for);
CREATE INDEX idx_scheduled_communications_status ON scheduled_communications(status);

-- RLS Policies
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Communication logs policies
CREATE POLICY "Users can view their organization's communication logs"
    ON communication_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = communication_logs.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create communication logs for their organization"
    ON communication_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = communication_logs.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Scheduled communications policies
CREATE POLICY "Users can view their organization's scheduled communications"
    ON scheduled_communications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = scheduled_communications.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage scheduled communications for their organization"
    ON scheduled_communications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = scheduled_communications.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('admin', 'organizer')
        )
    );

-- SMS templates policies
CREATE POLICY "Users can view their organization's SMS templates"
    ON sms_templates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = sms_templates.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and organizers can manage SMS templates"
    ON sms_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = sms_templates.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('admin', 'organizer')
        )
    );

-- Add SMS fields to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS sms_body TEXT,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT;