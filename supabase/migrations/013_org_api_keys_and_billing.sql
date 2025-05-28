-- Migration: Organization API Keys and Billing System
-- Description: Adds support for organization-specific API keys, billing, and rate limiting

-- Enable pgcrypto for encryption if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organization API Keys (encrypted storage)
CREATE TABLE organization_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL CHECK (service_name IN ('twilio', 'sendgrid', 'openai', 'stripe')),
  key_name TEXT NOT NULL, -- 'account_sid', 'auth_token', 'api_key', etc.
  encrypted_value TEXT NOT NULL, -- Will be encrypted using Supabase Vault
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_rotated_at TIMESTAMPTZ,
  CONSTRAINT unique_org_service_key UNIQUE(organization_id, service_name, key_name)
);

-- Organization Billing/Subscription
CREATE TABLE organization_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE organization_api_usage (
  id UUID DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'sms_sent', 'email_sent', 'call_made', etc.
  count INTEGER DEFAULT 1,
  cost_cents INTEGER DEFAULT 0, -- Track estimated costs
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for the next 12 months
DO $$
DECLARE
  start_date date := date_trunc('month', CURRENT_DATE);
  partition_date date;
  partition_name text;
BEGIN
  FOR i IN 0..11 LOOP
    partition_date := start_date + (i || ' months')::interval;
    partition_name := 'organization_api_usage_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF organization_api_usage
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + interval '1 month'
    );
  END LOOP;
END $$;

-- Rate Limits Configuration
CREATE TABLE rate_limit_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  limit_value INTEGER NOT NULL, -- -1 for unlimited
  window_seconds INTEGER NOT NULL, -- 3600 for hourly, 86400 for daily
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rate_limit_rule UNIQUE(plan_type, service_name, action_type, window_seconds)
);

-- API Key Audit Log
CREATE TABLE organization_api_key_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'rotated', 'accessed')),
  service_name TEXT NOT NULL,
  key_name TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_org_api_keys_active ON organization_api_keys(organization_id, service_name) WHERE is_active = true;
CREATE INDEX idx_org_api_keys_updated ON organization_api_keys(updated_at);
CREATE INDEX idx_org_usage_lookup ON organization_api_usage(organization_id, service_name, created_at DESC);
CREATE INDEX idx_org_subs_status ON organization_subscriptions(organization_id, status);
CREATE INDEX idx_org_subs_plan ON organization_subscriptions(plan_type) WHERE status = 'active';
CREATE INDEX idx_rate_limit_lookup ON rate_limit_rules(plan_type, service_name, action_type);
CREATE INDEX idx_api_key_audit_org ON organization_api_key_audit(organization_id, created_at DESC);

-- Insert default rate limit rules
INSERT INTO rate_limit_rules (plan_type, service_name, action_type, limit_value, window_seconds) VALUES
-- Free plan limits
('free', 'twilio', 'sms_sent', 20, 3600),      -- 20 SMS per hour
('free', 'twilio', 'sms_sent', 100, 86400),    -- 100 SMS per day
('free', 'twilio', 'call_made', 10, 3600),     -- 10 calls per hour
('free', 'twilio', 'call_made', 50, 86400),    -- 50 calls per day
('free', 'sendgrid', 'email_sent', 100, 3600), -- 100 emails per hour
('free', 'sendgrid', 'email_sent', 1000, 86400), -- 1000 emails per day

-- Basic plan limits
('basic', 'twilio', 'sms_sent', 100, 3600),
('basic', 'twilio', 'sms_sent', 1000, 86400),
('basic', 'twilio', 'call_made', 50, 3600),
('basic', 'twilio', 'call_made', 500, 86400),
('basic', 'sendgrid', 'email_sent', 1000, 3600),
('basic', 'sendgrid', 'email_sent', 10000, 86400),

-- Pro plan limits
('pro', 'twilio', 'sms_sent', 1000, 3600),
('pro', 'twilio', 'sms_sent', 10000, 86400),
('pro', 'twilio', 'call_made', 500, 3600),
('pro', 'twilio', 'call_made', 5000, 86400),
('pro', 'sendgrid', 'email_sent', 10000, 3600),
('pro', 'sendgrid', 'email_sent', 100000, 86400),

-- Enterprise plan (unlimited)
('enterprise', 'twilio', 'sms_sent', -1, 3600),
('enterprise', 'twilio', 'sms_sent', -1, 86400),
('enterprise', 'twilio', 'call_made', -1, 3600),
('enterprise', 'twilio', 'call_made', -1, 86400),
('enterprise', 'sendgrid', 'email_sent', -1, 3600),
('enterprise', 'sendgrid', 'email_sent', -1, 86400);

-- Create default free subscriptions for existing organizations
INSERT INTO organization_subscriptions (organization_id, plan_type, status, current_period_start, current_period_end)
SELECT 
  id,
  'free',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_subscriptions WHERE organization_id = organizations.id
);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_organization_id UUID,
  p_service_name TEXT,
  p_action_type TEXT
) RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  window_seconds INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_plan_type TEXT;
  v_limit_record RECORD;
  v_current_usage INTEGER;
BEGIN
  -- Get organization's plan type
  SELECT plan_type INTO v_plan_type
  FROM organization_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active'
  LIMIT 1;
  
  IF v_plan_type IS NULL THEN
    v_plan_type := 'free';
  END IF;
  
  -- Get applicable rate limits
  FOR v_limit_record IN 
    SELECT limit_value, window_seconds
    FROM rate_limit_rules
    WHERE plan_type = v_plan_type
      AND service_name = p_service_name
      AND action_type = p_action_type
    ORDER BY window_seconds
  LOOP
    -- Skip unlimited
    IF v_limit_record.limit_value = -1 THEN
      RETURN QUERY SELECT true, 0, -1, v_limit_record.window_seconds, NOW() + (v_limit_record.window_seconds || ' seconds')::INTERVAL;
      CONTINUE;
    END IF;
    
    -- Calculate current usage
    SELECT COALESCE(SUM(count), 0) INTO v_current_usage
    FROM organization_api_usage
    WHERE organization_id = p_organization_id
      AND service_name = p_service_name
      AND action_type = p_action_type
      AND created_at >= NOW() - (v_limit_record.window_seconds || ' seconds')::INTERVAL;
    
    -- Check if limit exceeded
    IF v_current_usage >= v_limit_record.limit_value THEN
      RETURN QUERY SELECT 
        false, 
        v_current_usage, 
        v_limit_record.limit_value, 
        v_limit_record.window_seconds,
        NOW() + (v_limit_record.window_seconds || ' seconds')::INTERVAL;
      RETURN;
    END IF;
  END LOOP;
  
  -- If we get here, all limits passed
  RETURN QUERY SELECT true, 0, -1, 0, NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to track API usage
CREATE OR REPLACE FUNCTION track_api_usage(
  p_organization_id UUID,
  p_service_name TEXT,
  p_action_type TEXT,
  p_count INTEGER DEFAULT 1,
  p_cost_cents INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
BEGIN
  INSERT INTO organization_api_usage (
    organization_id,
    service_name,
    action_type,
    count,
    cost_cents,
    metadata
  ) VALUES (
    p_organization_id,
    p_service_name,
    p_action_type,
    p_count,
    p_cost_cents,
    p_metadata
  ) RETURNING id INTO v_usage_id;
  
  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE organization_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_api_key_audit ENABLE ROW LEVEL SECURITY;

-- Only org admins can manage API keys
CREATE POLICY "Org admins can manage API keys" ON organization_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_api_keys.organization_id
        AND user_organizations.user_id = auth.uid()
        AND user_organizations.role = 'admin'
    )
  );

-- All org members can view subscription
CREATE POLICY "Org members can view subscription" ON organization_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_subscriptions.organization_id
        AND user_organizations.user_id = auth.uid()
    )
  );

-- Only org admins can view usage
CREATE POLICY "Org admins can view usage" ON organization_api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_api_usage.organization_id
        AND user_organizations.user_id = auth.uid()
        AND user_organizations.role = 'admin'
    )
  );

-- Everyone can view rate limit rules
CREATE POLICY "Public read rate limits" ON rate_limit_rules
  FOR SELECT USING (true);

-- Only org admins can view audit logs
CREATE POLICY "Org admins can view audit logs" ON organization_api_key_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.organization_id = organization_api_key_audit.organization_id
        AND user_organizations.user_id = auth.uid()
        AND user_organizations.role = 'admin'
    )
  );

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_api_keys_updated_at BEFORE UPDATE ON organization_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_rules_updated_at BEFORE UPDATE ON rate_limit_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();