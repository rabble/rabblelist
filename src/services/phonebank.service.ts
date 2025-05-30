import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retryUtils'

export interface PhoneBankSession {
  id: string
  campaignId: string
  userId: string
  status: 'active' | 'paused' | 'completed'
  startedAt: string
  endedAt?: string
  callsMade: number
  totalDuration: number
  metadata?: any
}

export interface PhoneBankCall {
  id: string
  sessionId: string
  contactId: string
  status: 'queued' | 'calling' | 'connected' | 'completed' | 'failed' | 'no_answer' | 'busy'
  duration?: number
  startedAt?: string
  endedAt?: string
  notes?: string
  outcome?: 'supporter' | 'undecided' | 'opposed' | 'wrong_number' | 'do_not_call' | 'callback'
  metadata?: any
}

export interface PhoneBankScript {
  id: string
  campaignId: string
  name: string
  content: string
  questions: PhoneBankQuestion[]
}

export interface PhoneBankQuestion {
  id: string
  question: string
  type: 'yes_no' | 'multiple_choice' | 'text' | 'rating'
  options?: string[]
  required: boolean
}

export class PhoneBankService {
  private static twilioWorkerUrl = import.meta.env.VITE_TELEPHONY_WEBHOOK_URL || 'https://telephony.rise.workers.dev/api/telephony'

  /**
   * Start a new phone banking session
   */
  static async startSession(campaignId: string, userId: string): Promise<PhoneBankSession> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('phonebank_sessions')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          status: 'active',
          started_at: new Date().toISOString(),
          calls_made: 0,
          total_duration: 0
        })
        .select()
        .single()

      if (error) throw error
      return this.mapSession(data)
    })
  }

  /**
   * Get active session for user
   */
  static async getActiveSession(userId: string): Promise<PhoneBankSession | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('phonebank_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null
      return this.mapSession(data)
    })
  }

  /**
   * End phone banking session
   */
  static async endSession(sessionId: string): Promise<void> {
    return withRetry(async () => {
      await supabase
        .from('phonebank_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    })
  }

  /**
   * Get next contact to call
   */
  static async getNextContact(campaignId: string, sessionId: string): Promise<any> {
    return withRetry(async () => {
      // Get campaign contacts that haven't been called in this session
      const { data: campaignContacts } = await supabase
        .from('campaign_contacts')
        .select(`
          contact_id,
          contacts (
            id,
            full_name,
            first_name,
            last_name,
            phone,
            tags,
            metadata
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'active')

      if (!campaignContacts || campaignContacts.length === 0) return null

      // Get calls made in this session
      const { data: sessionCalls } = await supabase
        .from('phonebank_calls')
        .select('contact_id')
        .eq('session_id', sessionId)

      const calledContactIds = new Set(sessionCalls?.map(c => c.contact_id) || [])

      // Find first uncalled contact with a phone number
      const nextContact = campaignContacts.find(cc => {
        const contact = cc.contacts as any
        return contact?.phone && !calledContactIds.has(cc.contact_id)
      })

      return nextContact ? (nextContact.contacts as any) : null
    })
  }

  /**
   * Start a call through Twilio
   */
  static async startCall(
    sessionId: string,
    contactId: string,
    _phoneNumber: string // Keep for future direct dialing
  ): Promise<string> {
    return withRetry(async () => {
      // Get user info for the ringer
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Create call record
      const { data: callRecord, error } = await supabase
        .from('phonebank_calls')
        .insert({
          session_id: sessionId,
          contact_id: contactId,
          status: 'initiating',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      try {
        // Initiate call through Twilio worker's start-call endpoint
        const response = await fetch(`${this.twilioWorkerUrl}/start-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify({
            contactId: contactId,
            ringerId: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`Failed to start call: ${errorData}`)
        }

        const result = await response.json()
        
        // Update call record with proxy session info
        await supabase
          .from('phonebank_calls')
          .update({
            metadata: {
              proxySessionSid: result.proxySessionSid,
              twilioSessionId: result.sessionId
            },
            status: 'calling'
          })
          .eq('id', callRecord.id)
        
        return callRecord.id
      } catch (error) {
        // Update call record as failed
        await supabase
          .from('phonebank_calls')
          .update({
            status: 'failed',
            ended_at: new Date().toISOString()
          })
          .eq('id', callRecord.id)
        
        throw error
      }
    })
  }

  /**
   * Update call status
   */
  static async updateCallStatus(
    callId: string,
    status: PhoneBankCall['status'],
    duration?: number
  ): Promise<void> {
    return withRetry(async () => {
      const updates: any = { status }
      
      if (duration !== undefined) {
        updates.duration = duration
      }

      if (status === 'completed' || status === 'failed' || status === 'no_answer') {
        updates.ended_at = new Date().toISOString()
      }

      await supabase
        .from('phonebank_calls')
        .update(updates)
        .eq('id', callId)

      // Update session stats if call completed
      if (status === 'completed' && duration) {
        const { data: call } = await supabase
          .from('phonebank_calls')
          .select('session_id, metadata')
          .eq('id', callId)
          .single()

        if (call) {
          // End the Twilio session if it exists
          if (call.metadata?.twilioSessionId) {
            try {
              await fetch(`${this.twilioWorkerUrl}/end-call`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                  sessionId: call.metadata.twilioSessionId
                })
              })
            } catch (error) {
              console.error('Failed to end Twilio session:', error)
            }
          }
          
          const { data: session } = await supabase
            .from('phonebank_sessions')
            .select('calls_made, total_duration')
            .eq('id', call.session_id)
            .single()

          if (session) {
            await supabase
              .from('phonebank_sessions')
              .update({
                calls_made: session.calls_made + 1,
                total_duration: session.total_duration + duration
              })
              .eq('id', call.session_id)
          }
        }
      }
    })
  }

  /**
   * Save call outcome and notes
   */
  static async saveCallOutcome(
    callId: string,
    outcome: PhoneBankCall['outcome'],
    notes?: string,
    responses?: any
  ): Promise<void> {
    return withRetry(async () => {
      await supabase
        .from('phonebank_calls')
        .update({
          outcome,
          notes,
          metadata: { responses }
        })
        .eq('id', callId)

      // Update contact tags based on outcome
      const { data: call } = await supabase
        .from('phonebank_calls')
        .select('contact_id')
        .eq('id', callId)
        .single()

      if (call) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('tags')
          .eq('id', call.contact_id)
          .single()

        if (contact) {
          const newTags = [...(contact.tags || [])]
          
          // Add outcome tag
          if (outcome === 'supporter' && !newTags.includes('supporter')) {
            newTags.push('supporter')
          } else if (outcome === 'do_not_call' && !newTags.includes('do_not_call')) {
            newTags.push('do_not_call')
          }

          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', call.contact_id)
        }
      }
    })
  }

  /**
   * Get phone bank statistics
   */
  static async getSessionStats(sessionId: string) {
    return withRetry(async () => {
      const { data: calls } = await supabase
        .from('phonebank_calls')
        .select('*')
        .eq('session_id', sessionId)

      const stats = {
        totalCalls: calls?.length || 0,
        completed: calls?.filter(c => c.status === 'completed').length || 0,
        supporters: calls?.filter(c => c.outcome === 'supporter').length || 0,
        undecided: calls?.filter(c => c.outcome === 'undecided').length || 0,
        opposed: calls?.filter(c => c.outcome === 'opposed').length || 0,
        noAnswer: calls?.filter(c => c.status === 'no_answer').length || 0,
        avgDuration: 0
      }

      if (stats.completed > 0) {
        const totalDuration = calls
          ?.filter(c => c.duration)
          .reduce((sum, c) => sum + c.duration, 0) || 0
        stats.avgDuration = Math.round(totalDuration / stats.completed)
      }

      return stats
    })
  }

  /**
   * Get phone bank script
   */
  static async getScript(campaignId: string): Promise<PhoneBankScript | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('phonebank_scripts')
        .select('*')
        .eq('campaign_id', campaignId)
        .single()

      if (error || !data) {
        // Return a default script if none exists
        return {
          id: 'default',
          campaignId: campaignId,
          name: 'Default Script',
          content: `Hi [Name], this is [Your Name] calling from [Organization]. 

I'm reaching out to talk about [Campaign Topic]. Do you have a minute to chat?

[If yes] Great! [Continue with your message]

[If no] No problem! Is there a better time I could call back?

Thank you for your time!`,
          questions: []
        }
      }
      return data
    })
  }

  /**
   * Save phone bank script
   */
  static async saveScript(script: Omit<PhoneBankScript, 'id'>): Promise<PhoneBankScript> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('phonebank_scripts')
        .upsert({
          campaign_id: script.campaignId,
          name: script.name,
          content: script.content,
          questions: script.questions
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  }

  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  private static mapSession(data: any): PhoneBankSession {
    return {
      id: data.id,
      campaignId: data.campaign_id,
      userId: data.user_id,
      status: data.status,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      callsMade: data.calls_made,
      totalDuration: data.total_duration,
      metadata: data.metadata
    }
  }
}