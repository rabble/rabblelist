import { supabase } from '@/lib/supabase';
import { CallSession, CallOutcome, TwilioToken } from './types';

class TelephonyService {
  private twilioDevice: any = null;
  private currentCall: any = null;
  private token: string | null = null;

  /**
   * Initialize the telephony service
   */
  async initialize(): Promise<void> {
    // Get Twilio access token
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    // Initialize Twilio Device (will be loaded dynamically)
    await this.initializeTwilioDevice(token);
  }

  /**
   * Get Twilio access token from backend
   */
  private async getAccessToken(): Promise<TwilioToken | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/telephony/token', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Initialize Twilio Device SDK
   */
  private async initializeTwilioDevice(token: TwilioToken): Promise<void> {
    // Dynamically import Twilio Client SDK
    const { Device } = await import('@twilio/voice-sdk');

    this.twilioDevice = new Device(token.token, {
      codecPreferences: ['opus', 'pcmu'],
      edge: 'sydney',
    });

    // Set up event handlers
    this.twilioDevice.on('ready', () => {
      console.log('Twilio Device ready');
    });

    this.twilioDevice.on('error', (error: any) => {
      console.error('Twilio Device error:', error);
    });

    this.twilioDevice.on('incoming', (call: any) => {
      console.log('Incoming call:', call);
      // Handle incoming calls if needed
    });

    // Register the device
    await this.twilioDevice.register();
  }

  /**
   * Start a call to a contact
   */
  async startCall(contactId: string): Promise<CallSession> {
    try {
      // Create call session in backend
      const response = await fetch('/api/telephony/start-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ contactId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start call');
      }

      const { sessionId, proxySessionSid } = await response.json();

      // Make the call through Twilio
      const params = {
        To: proxySessionSid, // The proxy session handles number masking
      };

      this.currentCall = await this.twilioDevice.connect(params);

      // Set up call event handlers
      this.currentCall.on('accept', () => {
        console.log('Call accepted');
        this.updateCallStatus(sessionId, 'connected');
      });

      this.currentCall.on('disconnect', () => {
        console.log('Call disconnected');
        this.updateCallStatus(sessionId, 'ended');
      });

      // Return call session
      return {
        id: sessionId,
        contactId,
        ringerId: '', // Will be filled by backend
        status: 'initiating',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<void> {
    if (this.currentCall) {
      this.currentCall.disconnect();
      this.currentCall = null;
    }
  }

  /**
   * Mute/unmute the current call
   */
  toggleMute(): void {
    if (this.currentCall) {
      const isMuted = this.currentCall.isMuted();
      this.currentCall.mute(!isMuted);
    }
  }

  /**
   * Update call status in backend
   */
  private async updateCallStatus(sessionId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('call_sessions')
        .update({ status, updated_at: new Date() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating call status:', error);
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  }

  /**
   * Save call outcome
   */
  async saveCallOutcome(sessionId: string, outcome: CallOutcome): Promise<void> {
    try {
      const { error } = await supabase
        .from('call_sessions')
        .update({
          outcome_status: outcome.status,
          outcome_sentiment: outcome.sentiment,
          outcome_summary: outcome.summary,
          outcome_next_action: outcome.nextAction,
          outcome_tags: outcome.tags,
          outcome_notes: outcome.notes,
          follow_up_date: outcome.followUpDate,
          updated_at: new Date(),
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving call outcome:', error);
      throw error;
    }
  }

  /**
   * Get call history for a contact
   */
  async getCallHistory(contactId: string): Promise<CallSession[]> {
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching call history:', error);
      return [];
    }
  }

  /**
   * Get call analytics
   */
  async getCallAnalytics(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('call_analytics')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching call analytics:', error);
      return null;
    }
  }

  /**
   * Check if telephony is available
   */
  isAvailable(): boolean {
    return this.twilioDevice !== null && this.twilioDevice.state === 'ready';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.currentCall) {
      this.currentCall.disconnect();
    }
    if (this.twilioDevice) {
      this.twilioDevice.destroy();
    }
  }
}

// Export singleton instance
export const telephonyService = new TelephonyService();