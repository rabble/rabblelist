/**
 * Cloudflare Worker for Telephony Integration
 * Handles Twilio webhooks, token generation, and call management
 */

const Twilio = require('twilio');

export interface Env {
  // Twilio credentials
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY: string;
  TWILIO_API_SECRET: string;
  TWILIO_PROXY_SERVICE_SID: string;
  TWILIO_PHONE_NUMBER: string;
  
  // Supabase credentials
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // OpenAI for analysis
  OPENAI_API_KEY: string;
  
  // KV namespace for session storage
  TELEPHONY_SESSIONS: KVNamespace;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handlers
      switch (path) {
        case '/api/telephony/token':
          return await handleTokenRequest(request, env);
        
        case '/api/telephony/start-call':
          return await handleStartCall(request, env);
        
        case '/api/telephony/end-call':
          return await handleEndCall(request, env);
        
        case '/api/telephony/webhook/voice':
          return await handleVoiceWebhook(request, env);
        
        case '/api/telephony/webhook/status':
          return await handleStatusWebhook(request, env);
        
        case '/api/telephony/webhook/proxy':
          return await handleProxyWebhook(request, env);
        
        case '/api/telephony/webhook/intercept':
          return await handleInterceptWebhook(request, env);
        
        case '/api/telephony/webhook/out-of-session':
          return await handleOutOfSessionWebhook(request, env);
        
        case '/api/telephony/sms/send':
          return await handleSendSMS(request, env);
        
        case '/api/telephony/webhook/sms':
          return await handleSMSWebhook(request, env);
        
        case '/api/telephony/webhook/sms/status':
          return await handleSMSStatusWebhook(request, env);
        
        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

async function handleTokenRequest(request: Request, env: Env): Promise<Response> {
  // Verify user authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.substring(7);
  const user = await verifySupabaseToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Generate Twilio access token
  const AccessToken = Twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const accessToken = new AccessToken(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_API_KEY,
    env.TWILIO_API_SECRET,
    { identity: user.id }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: env.TWILIO_PROXY_SERVICE_SID,
    incomingAllow: true,
  });

  accessToken.addGrant(voiceGrant);

  return new Response(
    JSON.stringify({
      token: accessToken.toJwt(),
      identity: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleStartCall(request: Request, env: Env): Promise<Response> {
  const { contactId, ringerId } = await request.json();
  
  // Create Twilio Proxy session
  const client = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  
  try {
    // Get contact details from Supabase
    const contact = await getContact(contactId, env);
    if (!contact) {
      return new Response('Contact not found', { status: 404 });
    }

    // Create proxy session
    const session = await client.proxy.v1
      .services(env.TWILIO_PROXY_SERVICE_SID)
      .sessions.create({
        uniqueName: `call-${contactId}-${Date.now()}`,
        ttl: 3600, // 1 hour
        participants: [
          {
            identifier: contact.phone, // Contact's real number
            friendlyName: contact.name,
          },
          {
            identifier: ringerId, // This would be the ringer's Twilio identity
            friendlyName: 'Ringer',
          },
        ],
      });

    // Store session in KV
    await env.TELEPHONY_SESSIONS.put(
      session.sid,
      JSON.stringify({
        contactId,
        ringerId,
        startTime: new Date().toISOString(),
        status: 'initiating',
      }),
      { expirationTtl: 3600 }
    );

    // Create call session in Supabase
    const callSession = await createCallSession({
      contactId,
      ringerId,
      proxySessionSid: session.sid,
      status: 'initiating',
    }, env);

    return new Response(
      JSON.stringify({
        sessionId: callSession.id,
        proxySessionSid: session.sid,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error starting call:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start call' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleEndCall(request: Request, env: Env): Promise<Response> {
  const { sessionId } = await request.json();
  
  // Update call status
  await updateCallSession(sessionId, { status: 'ended' }, env);
  
  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleVoiceWebhook(request: Request, env: Env): Promise<Response> {
  // Verify Twilio signature
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature || !verifyTwilioSignature(request, signature, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const callSid = formData.get('CallSid');
  const callStatus = formData.get('CallStatus');

  // Update call status in database
  if (callSid && callStatus) {
    await updateCallStatus(callSid as string, callStatus as string, env);
  }

  // Return TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say>Connecting your call. This call may be recorded for quality purposes.</Say>
      <Dial>
        <Number>{{To}}</Number>
      </Dial>
    </Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function handleStatusWebhook(request: Request, env: Env): Promise<Response> {
  // Handle call status updates
  const data = await request.json();
  console.log('Call status update:', data);
  
  return new Response('OK', { status: 200 });
}

// Helper functions
async function verifySupabaseToken(token: string, env: Env): Promise<any> {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function getContact(contactId: string, env: Env): Promise<any> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/contacts?id=eq.${contactId}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const contacts = await response.json();
  return contacts[0];
}

async function createCallSession(data: any, env: Env): Promise<any> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/call_sessions`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  return await response.json();
}

async function updateCallSession(sessionId: string, updates: any, env: Env): Promise<void> {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/call_sessions?id=eq.${sessionId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
}

async function updateCallStatus(callSid: string, status: string, env: Env): Promise<void> {
  // Update based on Twilio call SID
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/call_sessions?twilio_call_sid=eq.${callSid}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  );
}

function verifyTwilioSignature(request: Request, signature: string, env: Env): boolean {
  // TODO: Implement Twilio signature verification
  // For now, return true in development
  return true;
}

async function handleProxyWebhook(request: Request, env: Env): Promise<Response> {
  const data = await request.json();
  console.log('Proxy webhook:', data);
  
  // Handle proxy callbacks
  return new Response('OK', { status: 200 });
}

async function handleInterceptWebhook(request: Request, env: Env): Promise<Response> {
  const data = await request.json();
  console.log('Intercept webhook:', data);
  
  // You can intercept and modify the call here
  // For now, just let it proceed
  return new Response(JSON.stringify({ 
    action: 'proceed' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleOutOfSessionWebhook(request: Request, env: Env): Promise<Response> {
  const data = await request.json();
  console.log('Out of session webhook:', data);
  
  // Handle calls that come in when no session exists
  // You could create a new session or reject the call
  return new Response('OK', { status: 200 });
}

async function handleSendSMS(request: Request, env: Env): Promise<Response> {
  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { to, body, from, mediaUrl, statusCallback, twilioConfig } = await request.json();
  
  const client = new Twilio(
    twilioConfig?.accountSid || env.TWILIO_ACCOUNT_SID,
    twilioConfig?.authToken || env.TWILIO_AUTH_TOKEN
  );

  try {
    const messages = await Promise.all(
      to.map(async (recipient: string) => {
        const messageOptions: any = {
          body,
          from: from || env.TWILIO_PHONE_NUMBER,
          to: recipient,
        };

        if (mediaUrl) {
          messageOptions.mediaUrl = [mediaUrl];
        }

        if (statusCallback) {
          messageOptions.statusCallback = statusCallback;
        }

        return client.messages.create(messageOptions);
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        messages: messages.map(m => ({ sid: m.sid, to: m.to })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('SMS send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleSMSWebhook(request: Request, env: Env): Promise<Response> {
  // Verify Twilio signature
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature || !verifyTwilioSignature(request, signature, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const messageSid = formData.get('MessageSid');
  const messageStatus = formData.get('MessageStatus');
  const from = formData.get('From');
  const to = formData.get('To');
  const body = formData.get('Body');
  const numMedia = parseInt(formData.get('NumMedia') as string || '0');

  // Handle incoming SMS
  if (messageStatus === 'received' || !messageStatus) {
    // Find contact by phone number
    const contact = await findContactByPhone(from as string, env);
    
    if (contact) {
      // Log the incoming message
      await createCommunicationLog({
        organization_id: contact.organization_id,
        contact_id: contact.id,
        type: 'sms',
        content: body as string,
        recipient: from as string,
        status: 'received',
        metadata: {
          direction: 'inbound',
          message_sid: messageSid,
          from: from,
          to: to,
          media_count: numMedia,
          received_at: new Date().toISOString()
        }
      }, env);

      // Trigger webhook for the organization
      await triggerOrganizationWebhook(
        contact.organization_id,
        'communication.received',
        {
          type: 'sms',
          contact_id: contact.id,
          from: from,
          body: body,
          media_count: numMedia
        },
        env
      );
    }
  }

  // Return empty TwiML response
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  );
}

async function handleSMSStatusWebhook(request: Request, env: Env): Promise<Response> {
  // Verify Twilio signature
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature || !verifyTwilioSignature(request, signature, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const messageSid = formData.get('MessageSid');
  const messageStatus = formData.get('MessageStatus');

  // Update message status in database
  await updateMessageStatus(messageSid as string, messageStatus as string, env);

  return new Response('OK', { status: 200 });
}

// Helper functions for SMS
async function findContactByPhone(phone: string, env: Env): Promise<any> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/contacts?phone=eq.${encodeURIComponent(phone)}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const contacts = await response.json();
  return contacts[0];
}

async function createCommunicationLog(data: any, env: Env): Promise<void> {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/communication_logs`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
}

async function updateMessageStatus(messageSid: string, status: string, env: Env): Promise<void> {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/communication_logs?metadata->>message_sid=eq.${messageSid}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status,
        metadata: {
          status_updated_at: new Date().toISOString()
        }
      }),
    }
  );
}

async function triggerOrganizationWebhook(organizationId: string, event: string, data: any, env: Env): Promise<void> {
  // This would trigger any webhooks configured by the organization
  // For now, just log it
  console.log('Webhook trigger:', { organizationId, event, data });
}