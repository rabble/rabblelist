# Organization API Keys and Rate Limiting Plan

## Overview
Enable organizations to use their own API keys for third-party services (Twilio, SendGrid, etc.) with fallback to system keys for unpaid organizations with rate limiting.

## Architecture Design

### 1. Database Schema

```sql
-- Organization API Keys (encrypted storage)
CREATE TABLE organization_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'twilio', 'sendgrid', 'openai', etc.
  key_name TEXT NOT NULL, -- 'account_sid', 'auth_token', 'api_key', etc.
  encrypted_value TEXT NOT NULL, -- Encrypted using Supabase Vault
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_rotated_at TIMESTAMPTZ,
  UNIQUE(organization_id, service_name, key_name)
);

-- Organization Billing/Subscription
CREATE TABLE organization_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE organization_api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'sms_sent', 'email_sent', 'call_made', etc.
  count INTEGER DEFAULT 1,
  cost_cents INTEGER DEFAULT 0, -- Track estimated costs
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Partition by month for performance
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Rate Limits Configuration
CREATE TABLE rate_limit_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL, -- matches organization_subscriptions.plan_type
  service_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  limit_value INTEGER NOT NULL, -- -1 for unlimited
  window_seconds INTEGER NOT NULL, -- 3600 for hourly, 86400 for daily
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_type, service_name, action_type)
);

-- Indexes for performance
CREATE INDEX idx_org_api_keys_active ON organization_api_keys(organization_id, service_name, is_active);
CREATE INDEX idx_org_usage_lookup ON organization_api_usage(organization_id, service_name, created_at DESC);
CREATE INDEX idx_org_subs_status ON organization_subscriptions(organization_id, status);
```

### 2. Service Architecture

```typescript
// Core interfaces
interface APIKeyProvider {
  getKey(orgId: string, serviceName: string, keyName: string): Promise<string | null>
  setKey(orgId: string, serviceName: string, keyName: string, value: string): Promise<void>
  deleteKey(orgId: string, serviceName: string, keyName: string): Promise<void>
  rotateKey(orgId: string, serviceName: string, keyName: string, newValue: string): Promise<void>
}

interface RateLimiter {
  checkLimit(orgId: string, service: string, action: string): Promise<RateLimitResult>
  trackUsage(orgId: string, service: string, action: string, count: number): Promise<void>
  getUsage(orgId: string, service: string, period: 'hour' | 'day' | 'month'): Promise<UsageStats>
}

interface ServiceConfig {
  getConfig(orgId: string, service: string): Promise<ServiceConfiguration>
  isUsingOwnKeys(orgId: string, service: string): Promise<boolean>
}
```

### 3. Implementation Phases

#### Phase 1: Database and Core Infrastructure
1. Create database migrations for new tables
2. Implement Supabase Vault integration for encryption
3. Build APIKeyProvider service with encryption/decryption
4. Create RateLimiter service with Redis/Supabase caching

#### Phase 2: Service Layer Integration
1. Modify existing services to use organization-specific keys:
   - `EmailService`: Check org keys before using system keys
   - `SMSService`: Implement key selection logic
   - `PhoneBankService`: Add org-specific Twilio config
2. Add fallback logic when org keys fail
3. Implement usage tracking for all API calls

#### Phase 3: Admin UI
1. Create API Keys management page:
   - List configured services and keys
   - Add/edit/delete keys with validation
   - Test connection buttons
   - Key rotation interface
2. Build usage dashboard:
   - Current period usage by service
   - Cost estimates
   - Rate limit status
   - Historical usage graphs

#### Phase 4: Billing Integration
1. Integrate Stripe for subscription management
2. Create pricing tiers and plan definitions
3. Implement upgrade/downgrade flows
4. Add payment method management

#### Phase 5: Rate Limiting and Monitoring
1. Implement real-time rate limiting with queuing
2. Create alerts for rate limit approaching
3. Build admin monitoring dashboard
4. Add usage export/reporting features

### 4. Security Considerations

1. **Encryption**: All API keys encrypted using Supabase Vault
2. **Access Control**: Only org admins can manage API keys
3. **Audit Log**: Track all key operations
4. **Key Rotation**: Support for scheduled rotation
5. **Validation**: Test keys before saving
6. **Masking**: Show only last 4 characters in UI

### 5. Default Rate Limits by Plan

```typescript
const DEFAULT_LIMITS = {
  free: {
    sms: { daily: 100, hourly: 20 },
    email: { daily: 1000, hourly: 100 },
    calls: { daily: 50, hourly: 10 }
  },
  basic: {
    sms: { daily: 1000, hourly: 100 },
    email: { daily: 10000, hourly: 1000 },
    calls: { daily: 500, hourly: 50 }
  },
  pro: {
    sms: { daily: 10000, hourly: 1000 },
    email: { daily: 100000, hourly: 10000 },
    calls: { daily: 5000, hourly: 500 }
  },
  enterprise: {
    sms: { daily: -1, hourly: -1 }, // unlimited
    email: { daily: -1, hourly: -1 },
    calls: { daily: -1, hourly: -1 }
  }
}
```

### 6. Migration Strategy

1. **Phase 1**: Deploy infrastructure without breaking changes
2. **Phase 2**: Add UI for key management (optional use)
3. **Phase 3**: Migrate existing orgs to free plan
4. **Phase 4**: Enable rate limiting with generous limits
5. **Phase 5**: Introduce paid plans and billing

### 7. Example Implementation

```typescript
// services/api-key-service.ts
export class OrganizationAPIKeyService {
  async getServiceConfig(orgId: string, service: 'twilio' | 'sendgrid'): Promise<ServiceConfig> {
    // 1. Check if org has custom keys
    const customKeys = await this.getOrgKeys(orgId, service)
    
    // 2. Check org subscription status
    const subscription = await this.getOrgSubscription(orgId)
    
    // 3. Check rate limits
    const rateLimitStatus = await this.checkRateLimit(orgId, service)
    
    // 4. Return appropriate config
    if (customKeys && subscription.status === 'active') {
      return { useCustomKeys: true, keys: customKeys }
    }
    
    if (rateLimitStatus.exceeded) {
      throw new RateLimitError('Rate limit exceeded')
    }
    
    // Use system keys with rate limiting
    return { useCustomKeys: false, keys: this.getSystemKeys(service) }
  }
}
```

### 8. UI Components Needed

1. **API Keys Management** (`/organization/settings/api-keys`)
   - Service selector
   - Key input forms with validation
   - Connection test buttons
   - Usage summary cards

2. **Usage Dashboard** (`/organization/usage`)
   - Current period usage
   - Usage trends charts
   - Cost breakdown
   - Rate limit warnings

3. **Billing Page** (`/organization/billing`)
   - Current plan details
   - Upgrade/downgrade options
   - Payment methods
   - Invoice history

### 9. Environment Variables

Add to `.env.example`:
```env
# Encryption
SUPABASE_VAULT_KEY=your-vault-key

# Stripe (for billing)
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_ENABLED=true

# System API Keys (fallback)
SYSTEM_TWILIO_ACCOUNT_SID=xxx
SYSTEM_TWILIO_AUTH_TOKEN=xxx
SYSTEM_SENDGRID_API_KEY=xxx
```

### 10. Testing Strategy

1. **Unit Tests**: Encryption, rate limiting logic
2. **Integration Tests**: Key selection, fallback behavior
3. **E2E Tests**: Full flow from UI to API call
4. **Load Tests**: Rate limiter performance
5. **Security Tests**: Key exposure, access control