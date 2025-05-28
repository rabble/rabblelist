-- Campaign Activities and Related Tables
-- This migration creates the missing tables referenced in the demo data

-- Campaign activities table for tracking all campaign interactions
CREATE TABLE IF NOT EXISTS campaign_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'phone_call', 'email_sent', 'email_opened', 'email_clicked',
    'sms_sent', 'sms_received', 'canvass', 'event_attended',
    'petition_signed', 'donation_made', 'volunteer_shift',
    'social_share', 'form_submitted'
  )),
  outcome TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_campaign_activities_campaign (campaign_id),
  INDEX idx_campaign_activities_contact (contact_id),
  INDEX idx_campaign_activities_type (activity_type),
  INDEX idx_campaign_activities_created (created_at)
);

-- Campaign statistics table for tracking metrics over time
CREATE TABLE IF NOT EXISTS campaign_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_campaign_stats_campaign (campaign_id),
  INDEX idx_campaign_stats_type (stat_type),
  INDEX idx_campaign_stats_recorded (recorded_at)
);

-- Campaign updates/milestones table
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_campaign_updates_campaign (campaign_id),
  INDEX idx_campaign_updates_created (created_at)
);

-- Donations table for fundraising campaigns
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  processor_fee DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_donations_campaign (campaign_id),
  INDEX idx_donations_contact (contact_id),
  INDEX idx_donations_donated_at (donated_at),
  INDEX idx_donations_status (status)
);

-- Petition signatures table
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  petition_text TEXT NOT NULL,
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  zip_code TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  UNIQUE(campaign_id, contact_id),
  INDEX idx_petition_signatures_campaign (campaign_id),
  INDEX idx_petition_signatures_signed_at (signed_at)
);

-- Communication logs for email/SMS campaigns
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'voice')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  status TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_communication_logs_campaign (campaign_id),
  INDEX idx_communication_logs_contact (contact_id),
  INDEX idx_communication_logs_type (type),
  INDEX idx_communication_logs_created (created_at)
);

-- Phone bank sessions table
CREATE TABLE IF NOT EXISTS phonebank_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_calls INTEGER DEFAULT 0,
  successful_contacts INTEGER DEFAULT 0,
  voicemails_left INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_phonebank_sessions_campaign (campaign_id),
  INDEX idx_phonebank_sessions_caller (caller_id),
  INDEX idx_phonebank_sessions_started (started_at)
);

-- Phone bank calls table
CREATE TABLE IF NOT EXISTS phonebank_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES phonebank_sessions(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  duration_seconds INTEGER,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  called_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_phonebank_calls_session (session_id),
  INDEX idx_phonebank_calls_campaign (campaign_id),
  INDEX idx_phonebank_calls_contact (contact_id),
  INDEX idx_phonebank_calls_called_at (called_at)
);

-- RLS Policies
ALTER TABLE campaign_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonebank_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonebank_calls ENABLE ROW LEVEL SECURITY;

-- Campaign activities policies
CREATE POLICY "Users can view campaign activities in their org"
  ON campaign_activities FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create campaign activities"
  ON campaign_activities FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Campaign stats policies
CREATE POLICY "Users can view campaign stats in their org"
  ON campaign_stats FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Campaign updates policies
CREATE POLICY "Anyone can view public campaign updates"
  ON campaign_updates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view all updates in their org"
  ON campaign_updates FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Donations policies
CREATE POLICY "Users can view donations in their org"
  ON donations FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Petition signatures policies
CREATE POLICY "Anyone can view public petition signatures"
  ON petition_signatures FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view all signatures in their org"
  ON petition_signatures FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Communication logs policies
CREATE POLICY "Users can view communication logs in their org"
  ON communication_logs FOR SELECT
  USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Phone bank policies
CREATE POLICY "Users can view phonebank sessions in their org"
  ON phonebank_sessions FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view phonebank calls in their org"
  ON phonebank_calls FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );