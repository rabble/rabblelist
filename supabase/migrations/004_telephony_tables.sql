-- Telephony Tables for Call Management

-- Call sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  ringer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Twilio session information
  twilio_call_sid TEXT,
  proxy_session_sid TEXT,
  proxy_phone_number TEXT,
  
  -- Call status and timing
  status TEXT NOT NULL CHECK (status IN ('initiating', 'ringing', 'connected', 'ended', 'failed')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Recording and transcript
  recording_url TEXT,
  recording_duration INTEGER,
  transcript_id UUID,
  
  -- Outcome tracking
  outcome_status TEXT CHECK (outcome_status IN ('reached', 'voicemail', 'no_answer', 'busy', 'wrong_number', 'disconnected')),
  outcome_sentiment TEXT CHECK (outcome_sentiment IN ('positive', 'neutral', 'negative')),
  outcome_summary TEXT,
  outcome_next_action TEXT CHECK (outcome_next_action IN ('callback', 'remove', 'email', 'visit', 'none')),
  outcome_tags TEXT[],
  outcome_notes TEXT,
  follow_up_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call transcripts table
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  
  -- Transcript data
  language TEXT NOT NULL DEFAULT 'en',
  full_text TEXT,
  segments JSONB NOT NULL DEFAULT '[]', -- Array of {speaker, text, timestamp, confidence}
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  
  -- Sentiment analysis
  sentiment_overall FLOAT CHECK (sentiment_overall >= -1 AND sentiment_overall <= 1),
  sentiment_timeline JSONB, -- Array of {time, score}
  
  -- Content analysis
  keywords TEXT[],
  topics TEXT[],
  action_items TEXT[],
  risk_factors TEXT[],
  
  -- AI analysis results
  ai_summary TEXT,
  ai_suggestions JSONB,
  
  -- Metadata
  analyzed_by TEXT, -- Which AI model was used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telephony configuration per organization
CREATE TABLE IF NOT EXISTS telephony_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Provider settings
  provider TEXT NOT NULL DEFAULT 'twilio' CHECK (provider IN ('twilio', 'vonage', 'aws_connect')),
  
  -- Phone numbers by region
  phone_numbers JSONB NOT NULL DEFAULT '{}', -- {US: '+1234567890', UK: '+44...'}
  
  -- Feature flags
  enable_transcription BOOLEAN DEFAULT true,
  enable_ai_analysis BOOLEAN DEFAULT true,
  enable_recording BOOLEAN DEFAULT false,
  
  -- Limits
  max_call_duration_minutes INTEGER DEFAULT 30,
  monthly_minute_limit INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- Call scripts for organizations
CREATE TABLE IF NOT EXISTS call_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  script_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  
  -- Usage tracking
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Performance metrics
  success_rate FLOAT,
  average_sentiment FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_call_sessions_contact ON call_sessions(contact_id);
CREATE INDEX idx_call_sessions_ringer ON call_sessions(ringer_id);
CREATE INDEX idx_call_sessions_organization ON call_sessions(organization_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_created ON call_sessions(created_at DESC);
CREATE INDEX idx_call_transcripts_session ON call_transcripts(session_id);
CREATE INDEX idx_call_analytics_session ON call_analytics(session_id);

-- RLS Policies
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;

-- Users can see their own calls
CREATE POLICY "Users can view their own calls" ON call_sessions
  FOR SELECT USING (ringer_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can create calls for their organization
CREATE POLICY "Users can create calls" ON call_sessions
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can update their own calls
CREATE POLICY "Users can update their own calls" ON call_sessions
  FOR UPDATE USING (ringer_id = auth.uid());

-- Similar policies for transcripts and analytics
CREATE POLICY "Users can view call transcripts" ON call_transcripts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM call_sessions 
    WHERE call_sessions.id = call_transcripts.session_id 
    AND (call_sessions.ringer_id = auth.uid() OR call_sessions.organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  ));

CREATE POLICY "Users can view call analytics" ON call_analytics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM call_sessions 
    WHERE call_sessions.id = call_analytics.session_id 
    AND (call_sessions.ringer_id = auth.uid() OR call_sessions.organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  ));

-- Only admins can manage telephony config
CREATE POLICY "Admins can manage telephony config" ON telephony_config
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organization members can view call scripts
CREATE POLICY "Users can view call scripts" ON call_scripts
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Only admins can manage call scripts
CREATE POLICY "Admins can manage call scripts" ON call_scripts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update call scripts" ON call_scripts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete call scripts" ON call_scripts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );