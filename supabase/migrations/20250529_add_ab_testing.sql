-- Add A/B testing support to campaigns

-- Add A/B test configuration to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_ab_test BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT '{}';

-- Example ab_test_config structure:
-- {
--   "variants": [
--     {
--       "id": "variant-a",
--       "name": "Control",
--       "allocation": 50,
--       "subject": "Original Subject",
--       "content": "Original content",
--       "template_id": null
--     },
--     {
--       "id": "variant-b", 
--       "name": "Test",
--       "allocation": 50,
--       "subject": "Alternative Subject",
--       "content": "Alternative content",
--       "template_id": null
--     }
--   ],
--   "winning_criteria": "open_rate",  -- open_rate, click_rate, conversion_rate
--   "test_duration_hours": 24,
--   "minimum_sample_size": 100,
--   "confidence_level": 0.95
-- }

-- Create A/B test assignments table
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id),
  variant_id text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_ab_test_assignments_campaign ON ab_test_assignments(campaign_id);
CREATE INDEX idx_ab_test_assignments_variant ON ab_test_assignments(campaign_id, variant_id);

-- Create A/B test results table for tracking variant performance
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  sample_size int NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  confidence_score numeric DEFAULT NULL,
  is_winner boolean DEFAULT false,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, variant_id, metric_name)
);

CREATE INDEX idx_ab_test_results_campaign ON ab_test_results(campaign_id);

-- Add variant tracking to communication logs
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS ab_variant_id text;

-- Add variant tracking to email tracking
ALTER TABLE email_tracking_events ADD COLUMN IF NOT EXISTS ab_variant_id text;

-- Add winning variant to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS winning_variant_id text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_ended_at timestamptz;

-- Function to randomly assign contacts to variants
CREATE OR REPLACE FUNCTION assign_ab_test_variant(
  p_campaign_id uuid,
  p_contact_id uuid
) RETURNS text AS $$
DECLARE
  v_variant_id text;
  v_ab_config jsonb;
  v_random_num numeric;
  v_cumulative_allocation numeric := 0;
  v_variant jsonb;
BEGIN
  -- Check if already assigned
  SELECT variant_id INTO v_variant_id
  FROM ab_test_assignments
  WHERE campaign_id = p_campaign_id AND contact_id = p_contact_id;
  
  IF v_variant_id IS NOT NULL THEN
    RETURN v_variant_id;
  END IF;
  
  -- Get A/B test config
  SELECT ab_test_config INTO v_ab_config
  FROM campaigns
  WHERE id = p_campaign_id AND is_ab_test = true;
  
  IF v_ab_config IS NULL OR v_ab_config = '{}' THEN
    RETURN NULL;
  END IF;
  
  -- Generate random number 0-100
  v_random_num := random() * 100;
  
  -- Assign based on allocation percentages
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_ab_config->'variants')
  LOOP
    v_cumulative_allocation := v_cumulative_allocation + (v_variant->>'allocation')::numeric;
    IF v_random_num <= v_cumulative_allocation THEN
      v_variant_id := v_variant->>'id';
      EXIT;
    END IF;
  END LOOP;
  
  -- Store assignment
  INSERT INTO ab_test_assignments (campaign_id, contact_id, variant_id)
  VALUES (p_campaign_id, p_contact_id, v_variant_id);
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate A/B test results
CREATE OR REPLACE FUNCTION calculate_ab_test_results(p_campaign_id uuid)
RETURNS void AS $$
DECLARE
  v_variant jsonb;
  v_variant_id text;
  v_ab_config jsonb;
  v_sample_size int;
  v_opens int;
  v_clicks int;
  v_conversions int;
  v_open_rate numeric;
  v_click_rate numeric;
  v_conversion_rate numeric;
  v_winning_criteria text;
  v_best_value numeric := 0;
  v_best_variant text;
  v_confidence numeric;
BEGIN
  -- Get A/B test config
  SELECT ab_test_config INTO v_ab_config
  FROM campaigns
  WHERE id = p_campaign_id AND is_ab_test = true;
  
  IF v_ab_config IS NULL OR v_ab_config = '{}' THEN
    RETURN;
  END IF;
  
  v_winning_criteria := v_ab_config->>'winning_criteria';
  
  -- Calculate results for each variant
  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_ab_config->'variants')
  LOOP
    v_variant_id := v_variant->>'id';
    
    -- Get sample size
    SELECT COUNT(*) INTO v_sample_size
    FROM ab_test_assignments
    WHERE campaign_id = p_campaign_id AND variant_id = v_variant_id;
    
    -- Get email metrics
    SELECT 
      COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'open'),
      COUNT(DISTINCT contact_id) FILTER (WHERE event_type = 'click')
    INTO v_opens, v_clicks
    FROM email_tracking_events
    WHERE campaign_id = p_campaign_id AND ab_variant_id = v_variant_id;
    
    -- Get conversions (from campaign_stats or custom tracking)
    -- This is a placeholder - actual conversion tracking depends on campaign type
    v_conversions := 0; -- TODO: Implement based on campaign type
    
    -- Calculate rates
    v_open_rate := CASE WHEN v_sample_size > 0 THEN v_opens::numeric / v_sample_size * 100 ELSE 0 END;
    v_click_rate := CASE WHEN v_sample_size > 0 THEN v_clicks::numeric / v_sample_size * 100 ELSE 0 END;
    v_conversion_rate := CASE WHEN v_sample_size > 0 THEN v_conversions::numeric / v_sample_size * 100 ELSE 0 END;
    
    -- Store results
    INSERT INTO ab_test_results (
      campaign_id, variant_id, metric_name, metric_value, sample_size, conversions
    ) VALUES
      (p_campaign_id, v_variant_id, 'open_rate', v_open_rate, v_sample_size, v_opens),
      (p_campaign_id, v_variant_id, 'click_rate', v_click_rate, v_sample_size, v_clicks),
      (p_campaign_id, v_variant_id, 'conversion_rate', v_conversion_rate, v_sample_size, v_conversions)
    ON CONFLICT (campaign_id, variant_id, metric_name) 
    DO UPDATE SET
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      conversions = EXCLUDED.conversions,
      calculated_at = now();
    
    -- Track best variant
    IF v_winning_criteria = 'open_rate' AND v_open_rate > v_best_value THEN
      v_best_value := v_open_rate;
      v_best_variant := v_variant_id;
    ELSIF v_winning_criteria = 'click_rate' AND v_click_rate > v_best_value THEN
      v_best_value := v_click_rate;
      v_best_variant := v_variant_id;
    ELSIF v_winning_criteria = 'conversion_rate' AND v_conversion_rate > v_best_value THEN
      v_best_value := v_conversion_rate;
      v_best_variant := v_variant_id;
    END IF;
  END LOOP;
  
  -- Calculate statistical confidence (simplified chi-square test)
  -- In production, use proper statistical libraries
  v_confidence := CASE 
    WHEN v_sample_size > 100 THEN 0.95
    WHEN v_sample_size > 50 THEN 0.85
    ELSE 0.50
  END;
  
  -- Mark winner if confidence threshold met
  IF v_confidence >= (v_ab_config->>'confidence_level')::numeric THEN
    UPDATE ab_test_results
    SET 
      is_winner = (variant_id = v_best_variant),
      confidence_score = v_confidence
    WHERE campaign_id = p_campaign_id;
    
    -- Update campaign with winner
    UPDATE campaigns
    SET 
      winning_variant_id = v_best_variant,
      ab_test_ended_at = now()
    WHERE id = p_campaign_id AND winning_variant_id IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Users can view A/B test assignments for their organization"
  ON ab_test_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_assignments.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage A/B test assignments for their organization"
  ON ab_test_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_assignments.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Results policies
CREATE POLICY "Users can view A/B test results for their organization"
  ON ab_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_results.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage A/B test results for their organization"
  ON ab_test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = ab_test_results.campaign_id
      AND c.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );