-- Create email tracking tables for tracking opens, clicks, and other events

-- Email tracking events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  campaign_id uuid REFERENCES campaigns(id),
  contact_id uuid REFERENCES contacts(id),
  email_address text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('send', 'delivered', 'open', 'click', 'bounce', 'spam', 'unsubscribe', 'dropped')),
  event_data jsonb DEFAULT '{}',
  -- For click events, store the URL
  clicked_url text,
  -- For bounce events, store the reason
  bounce_reason text,
  -- Track multiple opens/clicks
  occurrence_count int DEFAULT 1,
  -- User agent and IP for opens/clicks
  user_agent text,
  ip_address inet,
  -- Device/client info
  device_type text,
  email_client text,
  -- Timestamps
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_email_tracking_campaign ON email_tracking_events(campaign_id);
CREATE INDEX idx_email_tracking_contact ON email_tracking_events(contact_id);
CREATE INDEX idx_email_tracking_email ON email_tracking_events(email_address);
CREATE INDEX idx_email_tracking_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_timestamp ON email_tracking_events(event_timestamp);
CREATE INDEX idx_email_tracking_org ON email_tracking_events(organization_id);

-- Email links table for tracking specific links in emails
CREATE TABLE IF NOT EXISTS email_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  original_url text NOT NULL,
  tracking_url text NOT NULL UNIQUE,
  link_alias text, -- Optional friendly name for the link
  click_count int DEFAULT 0,
  unique_click_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_links_tracking_url ON email_links(tracking_url);
CREATE INDEX idx_email_links_campaign ON email_links(campaign_id);

-- Add email tracking pixel URL to campaign assets
ALTER TABLE campaign_assets ADD COLUMN IF NOT EXISTS tracking_pixel_url text;
ALTER TABLE campaign_assets ADD COLUMN IF NOT EXISTS email_statistics jsonb DEFAULT '{
  "sent": 0,
  "delivered": 0,
  "opened": 0,
  "clicked": 0,
  "bounced": 0,
  "unsubscribed": 0,
  "spam_reports": 0,
  "unique_opens": 0,
  "unique_clicks": 0,
  "open_rate": 0,
  "click_rate": 0,
  "bounce_rate": 0
}';

-- Function to update email statistics
CREATE OR REPLACE FUNCTION update_email_statistics(p_campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE campaign_assets
  SET email_statistics = (
    SELECT jsonb_build_object(
      'sent', COUNT(*) FILTER (WHERE event_type = 'send'),
      'delivered', COUNT(*) FILTER (WHERE event_type = 'delivered'),
      'opened', COUNT(*) FILTER (WHERE event_type = 'open'),
      'clicked', COUNT(*) FILTER (WHERE event_type = 'click'),
      'bounced', COUNT(*) FILTER (WHERE event_type = 'bounce'),
      'unsubscribed', COUNT(*) FILTER (WHERE event_type = 'unsubscribe'),
      'spam_reports', COUNT(*) FILTER (WHERE event_type = 'spam'),
      'unique_opens', COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open'),
      'unique_clicks', COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click'),
      'open_rate', 
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
          THEN ROUND((COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'delivered')::numeric) * 100, 2)
          ELSE 0
        END,
      'click_rate',
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
          THEN ROUND((COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'delivered')::numeric) * 100, 2)
          ELSE 0
        END,
      'bounce_rate',
        CASE 
          WHEN COUNT(*) FILTER (WHERE event_type = 'send') > 0 
          THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'bounce')::numeric / 
                      COUNT(*) FILTER (WHERE event_type = 'send')::numeric) * 100, 2)
          ELSE 0
        END
    )
    FROM email_tracking_events
    WHERE campaign_id = p_campaign_id
  ),
  updated_at = now()
  WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when tracking events are inserted
CREATE OR REPLACE FUNCTION email_tracking_event_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics
  PERFORM update_email_statistics(NEW.campaign_id);
  
  -- Update link click counts if it's a click event
  IF NEW.event_type = 'click' AND NEW.clicked_url IS NOT NULL THEN
    UPDATE email_links
    SET 
      click_count = click_count + 1,
      unique_click_count = unique_click_count + 
        CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM email_tracking_events 
            WHERE campaign_id = NEW.campaign_id 
            AND contact_id = NEW.contact_id 
            AND event_type = 'click'
            AND clicked_url = NEW.clicked_url
            AND id != NEW.id
          ) THEN 1 
          ELSE 0 
        END,
      updated_at = now()
    WHERE tracking_url = NEW.clicked_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_tracking_event_after_insert
AFTER INSERT ON email_tracking_events
FOR EACH ROW
EXECUTE FUNCTION email_tracking_event_trigger();

-- RLS policies
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_links ENABLE ROW LEVEL SECURITY;

-- Email tracking events policies
CREATE POLICY "Users can view email tracking for their organization"
  ON email_tracking_events FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert email tracking for their organization"
  ON email_tracking_events FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Email links policies
CREATE POLICY "Users can view email links for their organization"
  ON email_links FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage email links for their organization"
  ON email_links FOR ALL
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));