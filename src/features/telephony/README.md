# Telephony Integration Architecture

## Overview
This feature enables anonymous calling where ringers don't see contact phone numbers, with automatic call transcription and AI-powered analysis.

## Services Used
1. **Twilio** - For anonymous calling via Proxy API
2. **Google Cloud Speech-to-Text** - For real-time transcription
3. **OpenAI GPT-4** - For call analysis and outcome extraction

## Architecture Flow
```
1. User clicks "Call" button
2. Frontend requests call session from backend
3. Cloudflare Worker creates Twilio Proxy session
4. Twilio masks numbers and connects the call
5. Audio streams to Google Speech-to-Text
6. Transcript analyzed by GPT-4 in real-time
7. Call summary and outcomes saved to Supabase
```

## Security
- Phone numbers never exposed to frontend
- All telephony operations through Cloudflare Workers
- Twilio credentials stored in environment variables
- Call recordings encrypted at rest