-- Webhook configuration table
CREATE TABLE webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  secret TEXT NOT NULL,
  description TEXT,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT webhook_configs_url_check CHECK (url ~ '^https?://')
);

-- Webhook events log table
CREATE TABLE webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_webhook_events_status (status),
  INDEX idx_webhook_events_next_retry (next_retry_at) WHERE status = 'pending'
);

-- Webhook delivery attempts table
CREATE TABLE webhook_delivery_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for webhook_configs
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's webhook configs"
  ON webhook_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhook configs"
  ON webhook_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = webhook_configs.organization_id
      AND role = 'admin'
    )
  );

-- RLS policies for webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's webhook events"
  ON webhook_events FOR SELECT
  USING (
    webhook_config_id IN (
      SELECT id FROM webhook_configs 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS policies for webhook_delivery_attempts
ALTER TABLE webhook_delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook delivery attempts"
  ON webhook_delivery_attempts FOR SELECT
  USING (
    webhook_event_id IN (
      SELECT id FROM webhook_events
      WHERE webhook_config_id IN (
        SELECT id FROM webhook_configs 
        WHERE organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      )
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_config_updated_at();

-- Function to trigger webhook events
CREATE OR REPLACE FUNCTION trigger_webhook_event(
  p_organization_id UUID,
  p_event_type TEXT,
  p_payload JSONB
) RETURNS VOID AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Find all active webhooks for this organization that subscribe to this event
  FOR v_webhook IN 
    SELECT * FROM webhook_configs 
    WHERE organization_id = p_organization_id 
    AND active = true
    AND p_event_type = ANY(events)
  LOOP
    -- Create webhook event
    INSERT INTO webhook_events (
      webhook_config_id,
      event_type,
      payload,
      status,
      next_retry_at
    ) VALUES (
      v_webhook.id,
      p_event_type,
      p_payload,
      'pending',
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX idx_webhook_configs_org_active ON webhook_configs(organization_id, active);
CREATE INDEX idx_webhook_events_config_status ON webhook_events(webhook_config_id, status);