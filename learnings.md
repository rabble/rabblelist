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
8. **Engagement Dashboard**: Real-time analytics and engagement tracking

## Contact History Timeline Implementation (Jan 28, 2025)

### Database Schema Insights
- The `contact_interactions` table is already well-structured with:
  - Type support for: call, text, email, event, note, tag_added, tag_removed
  - Direction tracking (inbound/outbound)
  - Status tracking (completed, missed, busy, no_answer, voicemail, scheduled, cancelled)
  - Metadata JSONB field for flexible additional data
  - User tracking for who performed the action

### Activity Aggregation Pattern
- Created a unified timeline by combining data from multiple tables:
  - `contact_interactions` - Main interaction tracking
  - `campaign_activities` - Campaign-specific activities 
  - `event_registrations` - Event participation
  - `call_logs` - Legacy call tracking (with duplicate detection)
- Using Promise.all() for parallel data fetching improves performance
- Sorting combined activities by timestamp creates a coherent timeline

### UI/UX Patterns
- Timeline component with visual hierarchy:
  - Color-coded icons for different activity types
  - Relative timestamps ("2 hours ago" vs exact dates)
  - Connecting lines between timeline items
  - Metadata display (call duration, user who performed action)
- Empty state handling with helpful messaging
- Loading states with skeleton animations

### Code Organization
- Separated timeline logic into dedicated ContactHistory component
- Used TypeScript discriminated unions for timeline item types
- Created helper functions for icon/color mapping
- Maintained consistency with existing UI patterns

## Contact Merge UI Implementation (Jan 28, 2025)

### Visual Merge Interface Design
- Created ContactMergeModal for side-by-side comparison of duplicate contacts
- Primary contact selection with visual indicators
- Field-by-field selection table with:
  - Visual representation of each field value
  - Click-to-select interface for choosing values
  - Special handling for merged fields (tags, custom fields)
  - Read-only fields that show calculated values (events attended)

### Merge Logic Improvements
- Comprehensive data transfer including:
  - contact_interactions
  - call_logs
  - event_registrations
  - campaign_activities
  - group_members
  - pathway_members
- Audit trail creation in contact_interactions for merge history
- Two-step confirmation process with summary review

### UI/UX Enhancements
- Visual comparison table with clear selection states
- Confirmation screen with merge summary
- Warning messages about irreversible actions
- Choice between "Quick Merge" (automatic) and "Visual Merge" (manual selection)
- Loading states and error handling

## Bulk Tag Operations Implementation (Jan 28, 2025)

### UI Design Patterns
- Created BulkTagOperations modal for managing tags on multiple contacts
- Two-column layout showing current tags with statistics and available tags
- Visual indicators for tag status: current, to be added, to be removed
- Real-time tag search and creation functionality
- Summary section showing pending changes before applying

### Tag Management Features
- Display tag statistics showing how many selected contacts have each tag
- Add multiple tags to all selected contacts at once
- Remove tags from all selected contacts
- Create new tags on the fly during bulk operations
- Prevent duplicate tag operations (can't add a tag that's already on all contacts)
- Visual feedback for pending changes with color coding

### Data Operations
- Efficient batch processing of tag updates
- Audit trail creation in contact_interactions for each tag change
- Support for bulk operations metadata to distinguish from individual edits
- Transaction-like processing to ensure consistency

### Integration Points
- Added "Manage Tags" button to bulk actions bar in ContactsManagement
- Modal triggered when contacts are selected
- Automatic refresh of contact list after operations complete
- Clear selection after successful bulk operation

## Smart Lists Implementation (May 28, 2025)

### Dynamic Contact Segmentation
- Created SmartLists component for creating dynamic contact lists based on criteria
- Support for multiple filter types:
  - Tags (any, all, none matching)
  - Last contact date (before, after, between, never)
  - Events attended (exactly, more than, less than, between)
  - Creation date filtering
  - Engagement level (prepared for future scoring implementation)

### Data Storage Pattern
- Smart lists stored in organization settings as JSON
- Each list includes:
  - Unique ID, name, and description
  - Criteria object with filter definitions
  - Timestamps for creation and updates
  - Real-time contact count calculation

### UI/UX Features
- Grid layout showing all smart lists with live contact counts
- Visual criteria summary with icons for each filter type
- Create/Edit modal with:
  - Multi-step criteria builder
  - Preview functionality to test criteria
  - Real-time validation
- Direct navigation to filtered contact view

### Technical Implementation
- Criteria-based query building with Supabase
- Complex tag filtering using array operations
- Date range comparisons for temporal filters
- Efficient count queries without loading full contact data
- URL parameter encoding for passing filters to contact list
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

## UI/UX Fixes (2025-05-28)
- Fixed landing page UI issues:
  - Resolved button styling inconsistencies
  - Fixed security features grid rendering with React array mapping
  - Added explicit button color classes for primary buttons
  - Simplified icon array mapping to prevent React rendering issues

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

## Database Schema Completeness (2025-05-28)
- **Schema Column Alignment**: Fixed missing columns in schema that were referenced in seed data
- Issues discovered:
  - contacts table missing: status, source, engagement_score, created_by
  - groups table missing: tags, is_active, group_type, created_by  
  - pathways table missing: pathway_type, status, created_by
  - group_members table missing: added_by
  - pathway_steps table missing: step_type, trigger_type, trigger_value, action_type, action_value, created_by
  - contact_interactions table missing: direction, status, duration
- All missing columns added with proper constraints and defaults
- Database setup now properly supports all features shown in seed data
- Complete schema ensures seed data loads without foreign key or column errors

## Engagement Dashboard Real Data Integration (2025-05-28)
- **Issue**: Dashboard was showing hardcoded/mocked data instead of real database values
- **Root Causes**:
  - Engagement ladder data was static array instead of database query
  - Campaign performance cards were hardcoded examples
  - Automated engagement metrics were fake
- **Solution**:
  - Added `getEngagementLadder()` method to AnalyticsService
    - Counts contacts by their tags (supporter, volunteer, organizer, leader)
    - Returns actual counts from database
  - Added `getCampaignPerformance()` method to AnalyticsService
    - Fetches active/completed campaigns
    - Gets real metrics like petition signatures
    - Calculates progress percentages
  - Fixed table/column reference errors in AnalyticsService:
    - phonebank_calls → phonebank_sessions
    - call_logs → contact_interactions
    - contact_pathway_progress → pathway_members
    - first_name/last_name → full_name
    - title → name in campaigns table
  - Updated EngagementDashboard component to:
    - Load ladder data on mount
    - Load campaign performance data
    - Display real metrics instead of hardcoded values
- **Seed Data Enhancement**:
  - Expanded from 10 to 500+ contacts with realistic distribution
  - Added engagement scoring and proper tag assignment
  - Created 8 active campaigns with different types
  - Added 10+ events showing past and future activities
  - Created 7 groups with realistic memberships
  - Generated thousands of interactions and activities
  - Fixed PostgreSQL array syntax: `ARRAY['value']` instead of string concatenation
- **Result**: Dashboard now shows actual campaign activity and engagement metrics from database

## Critical Feature Implementations (2025-05-28)

### Contact History Timeline
- Unified activity view aggregating data from multiple tables
- Color-coded timeline with icons for different activity types
- Efficient parallel data fetching with Promise.all()
- Shows interactions, campaigns, events, and calls in chronological order

### Contact Merge UI
- Visual side-by-side comparison for duplicate resolution
- Field-by-field selection with preview
- Comprehensive data transfer across all related tables
- Audit trail creation for compliance

### Bulk Tag Operations
- Multi-select interface for tag management
- Real-time statistics showing tag distribution
- Batch processing with audit trails
- Visual feedback for pending changes

### Smart Lists
- Dynamic contact segmentation saved as reusable filters
- Multiple criteria types: tags, dates, events, custom fields
- Real-time count calculation without loading all contacts
- Stored in organization settings for persistence

### Contact Scoring
- Configurable engagement scoring system
- Rules-based scoring across multiple categories
- Automatic calculation based on activities
- Visual score distribution

### Email Tracking Dashboard
- Campaign performance metrics (opens, clicks, bounces)
- Link-level analytics
- Recipient engagement timeline
- Visual charts and metrics

### Two-way SMS Conversations
- Real-time message threading
- Inbound/outbound tracking with delivery status
- Conversation search and filtering
- Integration with Supabase real-time subscriptions

### Event Confirmation Emails
- Automated emails on registration
- Reminder emails with configurable timing
- Check-in links and QR codes
- HTML templates with personalization

### Complete Offline Sync with Conflict Resolution
- Enhanced sync service with multiple resolution strategies
- Automatic conflict detection based on timestamps
- Visual conflict resolution interface
- Cross-tab synchronization
- Batch processing for efficiency
- Sync status indicator in header
- Admin dashboard for conflict management

### Key Technical Patterns Learned
1. **Parallel Data Fetching**: Use Promise.all() for independent queries
2. **Audit Trails**: Create interaction records for all data modifications
3. **Conflict Resolution**: Timestamp-based detection with merge strategies
4. **Real-time Updates**: Supabase channels for live data
5. **Batch Processing**: Handle bulk operations efficiently
6. **Visual Feedback**: Always show pending changes before applying
7. **Empty States**: Provide helpful next actions when no data
8. **Progressive Enhancement**: Build offline-first with sync capabilities

## Security Audit: Organization ID Filtering (2025-05-29)

### Critical Security Issue Discovered
- **Problem**: Multiple services lack proper organization_id filtering, allowing potential cross-organization data access
- **Impact**: Users from one organization could potentially view/modify data from other organizations
- **Root Cause**: Inconsistent implementation of organization filtering across services

### Services with Missing Organization Filters
1. **ContactService**: Most methods missing org filter (getContacts, getContact, updateContact, deleteContact, etc.)
2. **CampaignService**: Several methods missing validation (getCampaign, updateCampaign, deleteCampaign)
3. **EventService**: Update/delete operations missing org validation
4. **GroupsService**: All methods missing organization_id filtering
5. **PathwayService**: Most read operations missing org filter
6. **PetitionService**: All methods missing organization validation
7. **AnalyticsService**: Some methods missing org validation

### Security Best Practices Identified
1. **Always filter by organization_id**: Every query should include organization_id
2. **Validate ownership before updates/deletes**: Check resource belongs to user's org
3. **Use Row Level Security (RLS)**: Database-level protection as backup
4. **Avoid hardcoded IDs**: ContactService uses hardcoded demo org ID
5. **Create service base class**: Automatically include org_id in all queries
6. **Test with multiple orgs**: Verify data isolation works correctly

### Recommended Pattern for Fixes
```typescript
// Get org ID from authenticated user
const { data: profile } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user?.user?.id)
  .single()

// Include in all queries
query.eq('organization_id', profile.organization_id)

// Validate before updates
if (existing?.organization_id !== profile.organization_id) {
  throw new Error('Unauthorized')
}
```

### Action Items
- Created `organization_id_audit.md` with detailed findings
- All data services need security updates
- Add integration tests for organization isolation
- Consider using RLS policies as additional protection layer

### Organization ID Filtering Implementation (2025-05-29)
- **Comprehensive Security Update**: Fixed all services to properly filter by organization_id
- **Helper Functions Created**: 
  - `getCurrentOrganizationId()`: Gets org ID from authenticated user's profile
  - `validateResourceOwnership()`: Validates resource belongs to user's org before updates/deletes
- **Services Updated**:
  1. ContactService: Added org filtering to all methods, removed hardcoded demo ID
  2. CampaignService: Added ownership validation for updates/deletes
  3. EventService: Added org filtering and validation
  4. GroupsService: Added org filtering to all queries and membership operations
  5. PathwayService: Added comprehensive org filtering and validation
  6. PetitionService: Added org validation for all petition operations
- **Security Pattern Applied**:
  ```typescript
  // All read operations filter by org
  const organizationId = await getCurrentOrganizationId()
  query.eq('organization_id', organizationId)
  
  // All write operations validate ownership first
  await validateResourceOwnership('table_name', resourceId)
  ```
- **Cross-table Validation**: When linking resources (e.g., adding contact to group), both resources are validated
- **Error Handling**: Proper error messages for unauthorized access attempts
- **No More Hardcoded IDs**: All organization IDs now come from authenticated user context

## Authentication Issues and Fixes (2025-05-29)

### Login/Logout Problems Identified
- **Dual State Management**: Application was using both SupabaseAuthContext and authStore (Zustand), causing state conflicts
- **Race Conditions**: Auth state change handlers weren't properly handling rapid changes or component unmounting
- **Missing Error Handling**: Profile loading errors weren't propagated, leaving users in half-authenticated states
- **Navigation Loops**: LoginPage redirect logic ran on every render when user existed
- **Service Worker Interference**: Old service workers being cleared on every app load could interfere with sessions

### Fixes Implemented
1. **Enhanced SupabaseAuthContext**:
   - Added abort controller and mounted flag to prevent race conditions
   - Added proper error handling with state clearing on failures
   - Fixed auth state change listener to check if component is mounted
   - Added isInitialized flag to prevent premature state updates
   - Clear state immediately in signOut before Supabase call

2. **Protected Route Improvements**:
   - Added 5-second timeout to prevent infinite loading states
   - Properly handle cases where loading never resolves

3. **Key Code Changes**:
   ```typescript
   // Abort controller pattern
   const abortController = new AbortController()
   let mounted = true
   
   // Check mounted state before updates
   if (!mounted || abortController.signal.aborted) return
   
   // Clear state on signOut regardless of API success
   setUser(null)
   setProfile(null)
   await supabase.auth.signOut()
   ```

### Remaining Issues
- **AuthStore Still Used**: Several components (SMSConversations, PhoneBankCampaign, etc.) still import authStore
- **Need to Remove authStore**: To fully fix auth issues, need to update all components to use SupabaseAuthContext
- **Test Auth Flow**: After removing authStore, need to test login/logout thoroughly