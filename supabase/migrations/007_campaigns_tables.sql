-- Create campaigns tables for Rise.protest.net

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('petition', 'event', 'donation', 'email_blast', 'phone_bank', 'canvas', 'social')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'completed', 'archived')),
    description TEXT,
    goal INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign statistics table
CREATE TABLE campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    participants INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    new_contacts INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    calls_completed INTEGER DEFAULT 0,
    amount_raised DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, date)
);

-- Campaign contacts (participants)
CREATE TABLE campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'completed', 'opted_out')),
    source TEXT DEFAULT 'manual',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    UNIQUE(campaign_id, contact_id)
);

-- Campaign assets (emails, scripts, etc)
CREATE TABLE campaign_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email_template', 'sms_template', 'call_script', 'social_post', 'image', 'document')),
    name TEXT NOT NULL,
    content TEXT,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Petitions table
CREATE TABLE petitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target TEXT,
    goal INTEGER DEFAULT 1000,
    is_public BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Petition signatures
CREATE TABLE petition_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_phone TEXT,
    signer_zip TEXT,
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(petition_id, signer_email)
);

-- Donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    donor_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    donor_phone TEXT,
    donor_address JSONB,
    is_recurring BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaign_stats_campaign_date ON campaign_stats(campaign_id, date);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_contact ON campaign_contacts(contact_id);
CREATE INDEX idx_petitions_campaign ON petitions(campaign_id);
CREATE INDEX idx_petition_signatures_petition ON petition_signatures(petition_id);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_contact ON donations(contact_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Campaigns
CREATE POLICY "view_org_campaigns" ON campaigns FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "create_campaigns" ON campaigns FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "update_org_campaigns" ON campaigns FOR UPDATE USING (organization_id = get_user_organization_id());
CREATE POLICY "delete_org_campaigns" ON campaigns FOR DELETE USING (organization_id = get_user_organization_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Campaign stats
CREATE POLICY "view_org_campaign_stats" ON campaign_stats FOR SELECT USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_stats.campaign_id AND organization_id = get_user_organization_id()));
CREATE POLICY "manage_campaign_stats" ON campaign_stats FOR ALL USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_stats.campaign_id AND organization_id = get_user_organization_id()));

-- Campaign contacts
CREATE POLICY "view_campaign_contacts" ON campaign_contacts FOR SELECT USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_contacts.campaign_id AND organization_id = get_user_organization_id()));
CREATE POLICY "manage_campaign_contacts" ON campaign_contacts FOR ALL USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_contacts.campaign_id AND organization_id = get_user_organization_id()));

-- Campaign assets
CREATE POLICY "view_campaign_assets" ON campaign_assets FOR SELECT USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_assets.campaign_id AND organization_id = get_user_organization_id()));
CREATE POLICY "manage_campaign_assets" ON campaign_assets FOR ALL USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_assets.campaign_id AND organization_id = get_user_organization_id()));

-- Petitions (public view allowed)
CREATE POLICY "view_public_petitions" ON petitions FOR SELECT USING (is_public = true);
CREATE POLICY "view_org_petitions" ON petitions FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "manage_petitions" ON petitions FOR ALL USING (organization_id = get_user_organization_id());

-- Petition signatures (public can sign)
CREATE POLICY "public_sign_petitions" ON petition_signatures FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM petitions WHERE id = petition_signatures.petition_id AND is_public = true));
CREATE POLICY "view_petition_signatures" ON petition_signatures FOR SELECT USING (EXISTS (SELECT 1 FROM petitions WHERE id = petition_signatures.petition_id AND (is_public = true OR organization_id = get_user_organization_id())));

-- Donations
CREATE POLICY "view_org_donations" ON donations FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "create_donations" ON donations FOR INSERT WITH CHECK (true); -- Anyone can donate
CREATE POLICY "update_org_donations" ON donations FOR UPDATE USING (organization_id = get_user_organization_id());