export interface CallSession {
  id: string;
  contactId: string;
  ringerId: string;
  twilioSessionSid?: string;
  proxySessionSid?: string;
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  transcriptId?: string;
  outcome?: CallOutcome;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallOutcome {
  status: 'reached' | 'voicemail' | 'no_answer' | 'busy' | 'wrong_number' | 'disconnected';
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  nextAction?: 'callback' | 'remove' | 'email' | 'visit' | 'none';
  tags?: string[];
  notes?: string;
  followUpDate?: Date;
}

export interface CallTranscript {
  id: string;
  sessionId: string;
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
  createdAt: Date;
}

export interface TranscriptSegment {
  speaker: 'caller' | 'contact';
  text: string;
  timestamp: number;
  confidence: number;
}

export interface CallAnalytics {
  sessionId: string;
  sentiment: {
    overall: number; // -1 to 1
    timeline: { time: number; score: number }[];
  };
  keywords: string[];
  topics: string[];
  actionItems: string[];
  riskFactors?: string[];
}

export interface TwilioToken {
  token: string;
  identity: string;
  expiresAt: Date;
}

export interface ProxySession {
  sid: string;
  serviceSid: string;
  uniqueName: string;
  participants: ProxyParticipant[];
  status: 'in-progress' | 'closed';
  ttl: number;
}

export interface ProxyParticipant {
  sid: string;
  identifier: string; // phone number
  proxyIdentifier: string; // masked number
  friendlyName?: string;
}