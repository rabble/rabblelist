# Contact Manager PWA - Learnings

## Project Overview
- Mobile-first Progressive Web App (PWA) for contact management
- Built with React 18, TypeScript, Vite, Tailwind CSS, and Supabase
- Target deployment: Cloudflare Workers
- Purpose: Enable "Ringers" to call supporters through organized contact queues

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Offline Storage**: IndexedDB (via idb library)
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v7
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa with Workbox
- **CSV Parsing**: Papaparse

## Project Structure
```
contact-manager-pwa/
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── auth/          # Authentication
│   │   ├── contacts/      # Contact management
│   │   ├── admin/         # Admin dashboard
│   │   ├── dashboard/     # Main dashboard
│   │   ├── events/        # Event management
│   │   ├── groups/        # Groups/units management
│   │   └── pathways/      # Pathways management
│   ├── components/        # Shared components
│   ├── stores/           # Zustand stores
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities and Supabase client
│   └── types/            # TypeScript types
├── public/               # Static assets and PWA icons
├── supabase/            # Database migrations
└── dist/                # Build output
```

## Key Features Identified
1. **Authentication**: Multi-tenant with organization support
2. **Contact Management**: CRUD operations, tags, custom fields
3. **Calling Queue**: Priority-based contact queuing system
4. **Event Management**: Create events, check-ins, RSVPs
5. **Offline Support**: IndexedDB sync with Supabase
6. **CSV Import/Export**: Bulk contact management
7. **Admin Dashboard**: Organization and user management
8. **Mobile Optimization**: Touch-friendly UI, click-to-call
9. **PWA Features**: Installable, offline-capable, push notifications

## Current Implementation Status

### ✅ What's Working
- Basic project structure is set up
- All dependencies are installed
- PWA manifest and icons configured
- Basic routing structure in place
- TypeScript configuration
- Tailwind CSS configured with custom theme
- Basic component structure created
- Campaign management with full CRUD
- Pathways with member tracking
- Event registration system
- Contact management with tags and custom fields
- Multi-organization support

### ⚠️ Partially Implemented
- **Contact Queue**: UI is built and connected to Supabase
- **Contact Card**: Functional UI now saves to Supabase
- **Dashboard**: Layout exists with real data from Supabase
- **Offline Sync**: Store structure exists but not connected to IndexedDB
- **PWA**: Manifest exists but service worker not properly implemented

### ✅ Recently Fixed
- **Campaign Management**: Fully implemented from mockup to functional feature
- **Pathways System**: Complete implementation with member tracking
- **Event Registration**: New public registration system with capacity management
- **Authentication**: Now using real Supabase auth with full implementation
- **Supabase Integration**: All data operations now use real Supabase, mockData.ts removed
- **Contact Service**: Fully implemented with Supabase integration
- **Admin Dashboard**: Shows real statistics from Supabase
- **Contact Sorting**: Added sorting by name, date created, last contact, and events attended
- **Password Reset**: Implemented complete password reset flow with email
- **Logout Enhancement**: Proper logout that clears all local data including IndexedDB
- **Test Suite**: Fixed all test failures - 105 tests now passing
- **Auth Loading State**: Fixed endless loading issue by properly handling auth state and profile loading errors
- **Demo Login**: Fixed demo account setup and login functionality
  - Updated `setup-demo-user.js` script to use proper UUIDs
  - Fixed organization ID to match the UUID in database migrations
  - Handled existing user updates properly
  - Demo login now works with email: demo@example.com, password: demo123
- **RLS Infinite Recursion**: Fixed Row Level Security policies causing infinite recursion
  - Issue: `get_user_organization_id()` function was querying the users table with RLS enabled
  - Users table RLS policies were calling the same function, creating a loop
  - Solution: Rewrote user policies to avoid recursive function calls
  - Created SQL script to fix the issue: `fix-rls-recursion.sql`

### ❌ Not Implemented / Using Mocks
- **SMS/Email Communication**: No messaging capabilities (templates UI created but no backend)
- **Integrated Calling**: No Twilio/telephony integration (scripts UI created but no backend)
- **Fundraising**: No donation processing
- **Petitions**: Not implemented
- **User Registration**: No signup flow
- **Service Worker**: Referenced but file doesn't exist
- **Push Notifications**: Not implemented
- **Background Sync**: Not implemented
- **Conflict Resolution**: Not implemented
- **Real-time Updates**: Not implemented
- **Organization Switching**: UI exists but functionality not implemented
- **Email Template Management**: Not implemented (per user directive - low priority)

### 🐛 Known Issues
1. Service worker registration fails (file doesn't exist)
2. No pagination on list views
3. TypeScript build warnings about implicit any types
4. Event schema needs migration to match application code

## Database Schema (from migrations)
- Organizations table with multi-tenant support
- Contacts with custom fields and tags
- Events with check-ins
- Groups/Units hierarchy
- Pathways for engagement tracking
- Row Level Security (RLS) policies

## Environment Configuration
- Uses .env.local for Supabase credentials
- Demo mode toggle script available
- Database setup script provided

## Build & Deployment
- Vite for development and building
- Configured for Cloudflare Workers deployment
- PWA build includes service worker

## Notable Files
- `setup-database.sh`: Automated database setup
- `toggle-demo-mode.sh`: Switch between demo/real data
- `wrangler.toml`: Cloudflare Workers configuration
- Multiple README files with setup instructions

## Recent Implementations

### Retry Logic
- Created `retryUtils.ts` with exponential backoff and jitter
- Intelligent retry that skips auth/permission/validation errors
- Applied to ContactService and can be used across all services

### Organization Switching (Completed 2025-05-28)
- Created `OrganizationSwitcher` component for multi-org users
- Added migration for `user_organizations` junction table
- Created database functions for organization switching
- Implemented real organization switching with page reload
- Added `OrganizationInvite` component for adding users to organizations
- Supports both existing users and generates invite links for new users
- Organization switcher only shows when user has access to multiple orgs

### Custom Fields
- `CustomFieldsConfig` component for admin management
- Supports text, number, date, select, and checkbox types
- Fields stored in organization settings JSON
- Integrated into ContactForm with dynamic rendering

### Contact Deduplication
- `ContactDeduplication` component finds duplicates by phone/email/name
- Merges all data into primary (oldest) contact
- Updates all references in related tables
- Batch merge capability for multiple groups

### Testing Infrastructure
- Added comprehensive test suites for AuthContext and ProtectedRoute
- Created debug tests to identify loading state issues
- Fixed error handling in AuthContext for:
  - Missing Supabase configuration
  - Network errors
  - Profile loading failures
  - Synchronous errors in getSession
- Added try-catch blocks to handle both sync and async errors
- Ensured loading state always resolves to false even on errors

## UI/UX Considerations
- Mobile-first design approach
- Touch-optimized interfaces
- Offline feedback mechanisms
- Loading states and error handling
- Accessibility features needed

## Security Considerations
- Row Level Security in Supabase
- Organization-based data isolation
- Authentication required for all operations
- API key management

## Performance Optimizations
- Code splitting for features
- Lazy loading routes
- IndexedDB for offline caching
- PWA caching strategies

## Integration Points
- Supabase for backend
- Potential SMS/calling service integration
- CSV import/export functionality
- Push notification service

## Deployment Learnings

### Cloudflare Pages Deployment
- Successfully deployed to Cloudflare Pages using `wrangler pages deploy`
- Production URL: https://contact-manager-pwa.pages.dev
- Build output directory: `dist/`
- Environment variables need to be set in Cloudflare dashboard separately from wrangler.toml

### TypeScript Build Fixes
- Fixed error handling in catch blocks by properly typing errors:
  - Changed `err.message` to `err instanceof Error ? err.message : 'fallback'`
  - This prevents TypeScript TS18046 errors for unknown types in catch blocks

### Character Encoding Issues
- Terminal output may show Unicode/encoding issues when using wrangler CLI
- The deployment still works correctly despite display issues

## Feature Implementations (2025-01-27)

### Campaign Management
- Converted from UI mockup to fully functional feature
- Database schema includes campaigns, stats, assets, petitions, donations tables
- Campaign types: petition, event, donation, email_blast, phone_bank, canvas, social
- Full CRUD operations with retry logic
- Campaign store aggregates statistics from related tables
- CampaignForm supports all campaign types with appropriate fields
- CampaignDetail shows progress tracking and allows adding contacts

### Pathways/Engagement Ladders
- Converted from UI mockup to functional feature
- pathway_members table tracks member progress through steps
- Dynamic step management with drag-and-drop reordering
- Member statistics: completion rate, average duration, active members per step
- PathwayForm completely rewritten with real-time step editing
- Support for required/optional steps and duration estimates

### Event Registration System
- New public-facing feature for event sign-ups
- Comprehensive registration system with capacity management
- Automatic waitlist and promotion when spots open up
- Custom registration fields per event
- Check-in functionality with timestamps
- Export registrations to CSV
- Public registration form at /events/:id/register
- Real-time statistics in EventDetail view
- Support for ticket types and pricing (payment processing not implemented)

## Feature Implementations (2025-05-28)

### Analytics and Engagement
- **Campaign Analytics**: Replaced all mock data with real Supabase queries
  - Created AnalyticsService with methods for campaign and engagement statistics
  - Time series data aggregated from campaign_stats table
  - Channel performance metrics from communication logs and phonebank calls
  - Recent activity feed from signatures, calls, and events
- **Engagement Dashboard**: Converted from static mockup to dynamic data
  - Real-time engagement metrics from contact activity
  - Segment calculation based on last contact date
  - Integration with event registrations and petition signatures
  - Reusable analytics service for organization-wide stats

### Template Management UIs
- **SMS Templates**: Created comprehensive template management system
  - Template creation with variable substitution support
  - Character count with multi-part SMS detection
  - Usage tracking and tagging system
  - Search and filter capabilities
  - Template duplication for quick variations
- **Phone Banking Scripts**: Built script management interface
  - Multi-section scripts (intro, main, objections, closing)
  - Objection handling with paired responses
  - Variable insertion for personalization
  - Usage statistics and categorization
  - Script templates for common scenarios (GOTV, recruitment, education)

### Legal Pages
- **Terms of Service**: Created React component version
  - Catalyst/organizing specific terms
  - Communication compliance requirements
  - Open source acknowledgments
  - Proper routing at /terms
- **Privacy Policy**: Built comprehensive privacy page
  - Detailed data collection and usage policies
  - Contact data handling responsibilities
  - GDPR and CCPA compliance sections
  - Security measures documentation
  - Routing at /privacy with login page integration

## Contact Queue Implementation (2025-05-28)
- The contact queue was showing "no contacts" because it was looking for a `call_assignments` table that doesn't exist
- Solution: Load contacts directly from the contacts table, prioritizing those never called
- The contacts table uses `last_contacted` field, not `last_called_at`
- The contacts table uses a single `full_name` field instead of `first_name`/`last_name` (see migration 003)
- When no contacts are available, provide helpful navigation to pathways, events, and campaigns
- Contacts become available for calling based on:
  - Never been contacted (highest priority)
  - Not contacted in 30+ days (secondary priority)
- Empty state now provides actionable next steps for volunteers

## Email Service Integration (2025-05-28)
- Replaced mocked Mailgun implementation with Twilio SendGrid
- SendGrid integrates seamlessly with existing Twilio account (single billing)
- Key implementation details:
  - SendGrid API uses different format than Mailgun (personalizations array)
  - Batch sending supports up to 1000 recipients per API call
  - Dynamic templates can be stored in SendGrid or our database
  - Webhook events come as arrays, not single objects
- Environment variables needed:
  - `VITE_SENDGRID_API_KEY`: API key from SendGrid dashboard
  - `VITE_SENDGRID_FROM_EMAIL`: Verified sender email
  - Template IDs for each email type (optional)
- Free tier provides 100 emails/day which is good for testing
- Production would need Essentials ($19.95/mo) or Pro (usage-based) plan

## Organization API Keys Implementation (2025-05-28)
- Designed and implemented per-organization API key management system
- Key features:
  - Organizations can use their own API keys for third-party services
  - Automatic fallback to system keys for unpaid organizations
  - Rate limiting based on subscription plan (free/basic/pro/enterprise)
  - Usage tracking and cost estimation
  - Encrypted key storage (placeholder for Supabase Vault)
- Database schema:
  - `organization_api_keys`: Encrypted storage for service credentials
  - `organization_subscriptions`: Billing and plan management
  - `organization_api_usage`: Monthly partitioned usage tracking
  - `rate_limit_rules`: Configurable limits by plan and service
  - `organization_api_key_audit`: Audit trail for security
- Service layer implementation:
  - `OrganizationAPIKeyService`: Singleton for key management
  - Key CRUD operations with audit logging
  - Rate limit checking before API calls
  - Usage tracking after successful calls
  - Service configuration with custom key fallback
- Modified services:
  - `EmailService`: Now checks org keys before system keys
  - `SMSService`: Supports org-specific Twilio credentials
  - Both services track usage for billing/rate limiting
- Admin UI:
  - `APIKeysManagement` component at `/admin/api-keys`
  - Secure input fields with masking
  - Test connection functionality
  - Shows subscription status and rate limits
- Implementation notes:
  - Keys should be encrypted using Supabase Vault in production
  - Cloudflare Worker needs updates to accept org-specific keys
  - Rate limiting uses database functions for accuracy
  - Usage partitioned by month for performance
- Next steps for completion:
  - Implement Stripe billing integration
  - Create usage monitoring dashboard
  - Add real encryption with Supabase Vault
  - Update Cloudflare Workers to use org keys
  - Add webhook for Stripe subscription events