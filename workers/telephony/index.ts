/**
 * Cloudflare Worker for Telephony Integration
 * Handles Twilio webhooks, token generation, and call management
 */

import { Twilio } from 'twilio';

export interface Env {
  // Twilio credentials
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY: string;
  TWILIO_API_SECRET: string;
  TWILIO_PROXY_SERVICE_SID: string;
  
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