# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Database Setup Reorganization** - Separated schema from seed data (2025-05-28)
  - Split `complete_setup.sql` into `schema.sql` (structure only) and `seed-data.sql` (demo data)
  - Makes it easier to set up production databases without demo data
  - Updated all setup scripts and documentation to use new file names
  - Cleaner separation of concerns for database initialization

### Fixed
- Allow logged-in users to view landing page at "/" instead of auto-redirecting to dashboard

### Added
- **Contact History Timeline** - Complete interaction log showing all activities for a contact (2025-01-28)
  - Aggregates data from multiple sources: interactions, campaigns, events, and calls
  - Visual timeline with color-coded icons for different activity types
  - Relative timestamps and activity metadata display
  - Empty state and loading animations
  - Added `getContactInteractions` method to ContactService
  - Added `getCampaignActivitiesByContact` and `getEventRegistrationsByContact` to AnalyticsService
- **Sentry Error Tracking** - Application monitoring and error reporting (2025-05-28)
  - Integrated Sentry for real-time error tracking and monitoring
  - Added error boundaries to gracefully handle runtime errors
  - Configured performance monitoring and session replay
  - Enabled PII collection for better debugging context
- **Demo Campaign Data** - Comprehensive demo campaigns with realistic data (2025-05-28)
  - Created 8 fully-featured campaigns across all campaign types
  - Climate petition with 3,847 signatures and public comments
  - Town hall event with 147 registrations and attendance tracking
  - Phone bank campaign with 1,456 calls and detailed outcomes
  - Completed email campaign with open/click statistics
  - Active SMS rapid response system with 423 subscribers
  - Fundraising campaign at 77% of $50k goal with 155 donations
  - Door-to-door canvassing with 673 contacts and field notes
  - Social media campaign with hashtag tracking and reach metrics
  - Added campaign updates, milestones, and activity logs
  - Created supporting tables for activities, stats, donations, and communications
- **Webhook Automation System** - Real-time event notifications and integrations (2025-05-28)
  - Complete webhook management interface for configuring endpoints
  - Support for 20+ event types across contacts, campaigns, events, and pathways
  - Webhook testing interface to validate endpoints
  - HMAC signature verification for security
  - Retry mechanism with exponential backoff for reliability
  - Comprehensive API documentation with interactive examples
  - n8n integration guide with pre-built workflow templates
  - Database schema for webhook configs, events, and delivery attempts
  - Real-time webhook delivery with queueing system
- **Analytics Implementation** - Replaced mock data with real queries (2025-05-28)
  - Created AnalyticsService for campaign and engagement statistics
  - Campaign Analytics now fetches real time series data
  - Engagement Dashboard displays actual contact activity metrics
  - Recent activity feeds pull from multiple data sources
- **Template Management UIs** - Created management interfaces for communication
  - SMS Templates component with variable substitution and character counting
  - Phone Banking Scripts interface with objection handling
  - Both include search, filtering, and usage tracking
- **Legal Pages** - Added Terms of Service and Privacy Policy
  - React component versions replacing static HTML
  - Proper routing at /terms and /privacy
  - Catalyst-specific terms focused on organizing
  - Comprehensive privacy policy with GDPR/CCPA sections
- **Organization Switching** - Multi-organization support
  - Created user_organizations junction table with migration
  - Database functions for switching organizations
  - OrganizationSwitcher component in header (only shows for multi-org users)
  - OrganizationInvite component for admins to add users
  - Support for both existing users and invite link generation
- **Real-time Analytics** - Auto-refresh functionality
  - Added 30-second auto-refresh to Campaign Analytics
  - Added 30-second auto-refresh to Engagement Dashboard
  - Toggle controls and manual refresh buttons
  - Visual indication of last update time
- **Twilio SendGrid Email Integration** - Replaced mock email with real service (2025-05-28)
  - Integrated SendGrid through existing Twilio account
  - Batch sending support for campaigns (1000 recipients per API call)
  - Email event tracking via webhooks (opens, clicks, bounces)
  - Dynamic template support with personalization
  - Unsubscribe handling and compliance features
  - Created setup documentation for SendGrid configuration

### Fixed
- **Contact Creation** - Fixed database field mismatch (2025-05-28)
  - Updated contact form to use full_name instead of first_name/last_name
  - Fixed contact creation failing due to schema mismatch
- **Contact Queue** - Fixed "no contacts" issue and improved empty state (2025-05-28)
  - Updated getCallQueue to load contacts directly from contacts table
  - Fixed field name to use 'last_contacted' instead of 'last_called_at'
  - Added helpful navigation to pathways, events, and campaigns when no contacts available
  - Prioritize contacts that have never been called over those called 30+ days ago
- **Navigation Issues** - Fixed broken navigation flows (2025-05-28)
  - Add Contact button now navigates to full form instead of inline creation
  - View All Activity button in Engagement Dashboard now works correctly
  - Create Automation button properly navigates to automation integrations
- **Campaign Forms** - Created type-specific campaign forms (2025-05-28)
  - Each campaign type now has appropriate custom fields
  - Fixed template loading in campaign creation
  - Added proper form validation for each campaign type
- **Pathway Creation** - Fixed pathway template functionality (2025-05-28)
  - Templates now properly pass through navigation state
  - Fixed pathway creation with pre-populated templates
- **Admin Actions** - Implemented working admin functionality (2025-05-28)
  - Added routes for user creation form
  - Custom fields configuration now accessible
  - Fixed admin dashboard action buttons

### Changed
- **Platform Evaluation** - Comprehensive assessment of Rise.protest.net capabilities (2025-01-27)
  - Conducted systematic review of all features and functionality
  - Updated TODO.md with complete feature gap analysis
  - Reorganized development roadmap into priority tiers
  - Added accurate development status section to README.md
  - Documented platform completion at ~35% of full vision
  - Identified critical missing features: email, SMS, calling, fundraising, petitions
  - Clarified that campaigns and pathways are UI mockups only
- **Professional Landing Page Redesign** - Following SaaS best practices
  - Removed all emojis for professional appearance
  - Restructured "History's Lesson" as integrated problem statement
  - Created clear problem/solution narrative flow
  - Organized content following SaaS landing page patterns
  - Improved visual hierarchy and information architecture
  - Maintained powerful organizing narrative while improving professionalism
  - Added all 4 demo screenshots (dashboard, contacts, campaigns, pathways)
  - Created alternating left/right layout for visual variety
  - Detailed feature descriptions for each platform component

### Added
- **Email Campaign System** - Functional email campaigns with Mailgun integration (2025-01-27)
  - Email configuration with API key and domain settings
  - Email service for sending single and bulk emails  
  - Email campaign UI with preview and test email functionality
  - Campaign email analytics tracking
  - Integration with campaign management system
  - Mock Mailgun API implementation for development

- **SMS Campaign System** - Twilio SMS integration for campaigns (2025-01-27)
  - SMS service using existing Twilio configuration
  - Bulk SMS campaigns with personalization
  - SMS character counting and segment calculation
  - Media attachment support (MMS)
  - SMS templates management
  - Test SMS functionality
  - Integration with campaign management system
  - Communication logs database for tracking all messages

- **Phone Banking System** - Interactive calling interface for campaigns (2025-01-27)
  - Phone banking session management
  - Contact queue with automatic progression
  - Call outcome tracking (supporter, undecided, opposed, etc.)
  - Real-time script display during calls
  - Session statistics and performance metrics
  - Integration with Twilio for future VoIP implementation
  - Database schema for sessions, calls, and scripts

- **Petition System** - Public petition signing functionality (2025-01-27)
  - Public petition signing page with real-time signature count
  - Signature validation and duplicate prevention
  - Optional fields: phone, zip code, and public comments
  - Recent signatures display with privacy controls
  - Geographic analysis by zip code
  - Signature export to CSV
  - Social sharing integration
  - Automatic contact creation from signatures

- **Campaign Management** - Converted UI mockup to functional feature (2025-01-27)
  - Created complete database schema for campaigns, stats, assets, petitions, donations
  - Built campaign service with full CRUD operations
  - Implemented campaign store using Zustand
  - Created CampaignForm component for create/edit with type selection
  - Updated CampaignManagement to use real data instead of mocks
  - Added CampaignDetail view with progress tracking
  - Supports petition, event, donation, email, phone bank, canvas, and social campaigns

- **Pathways/Engagement Ladders** - Converted UI mockup to functional feature (2025-01-27)
  - Created pathway_members table for tracking member progress
  - Built pathway service with full CRUD operations
  - Implemented pathway store with member management
  - Updated PathwaysManagement to use real data
  - Completely rewrote PathwayForm for dynamic step management
  - Added member progress tracking and statistics

- **Event Registration System** - New public-facing feature (2025-01-27)
  - Created comprehensive event_registrations database schema
  - Built registration service with capacity management
  - Implemented auto-promotion from waitlist
  - Created public registration form at /events/:id/register
  - Updated EventDetail with registration list and check-in
  - Added custom registration fields support
  - Export registrations to CSV functionality
  - Real-time registration statistics

- **About Page** - New marketing page explaining organizing theory and theory of change
  - Historical organizing wisdom and digital crisis moment problem
  - Popular education meets algorithmic organizing concepts
  - Strategic escalation in the attention economy
  - Crisis infrastructure for distributed resilience
  - Building resilient movement infrastructure
- **Landing Page Navigation** - Added navigation header to landing and about pages
  - Consistent navigation between marketing pages
  - Added About link to footer navigation
- **Enhanced Landing Page** - Complete redesign with powerful marketing copy
  - Historical movement lessons integrated with features
  - Crisis response framework (48-hour conversion window)
  - Movement wisdom section (what worked vs what failed)
  - Security and resilience features highlighted
  - Screenshots showcasing dashboard and contact management
  - Ferguson Model → Digital Scale workflow
- **Rise.Protest.net Branding** - Updated all branding from Catalyst to Rise
  - New megaphone logo icon across all pages
  - Emerald green color scheme (matching theme)
  - Consistent branding in header, landing, and about pages

### Changed
- **Dashboard Layout** - Improved balance for large screens
  - Changed from 3:1 to 2:1 layout with Recent Calls in sidebar
  - Stacked Quick Actions and Today's Activity in main column
  - More compact Recent Calls design for sidebar display
- **Unified Color Scheme** - Complete color unification using emerald theme
  - Updated Tailwind config to use emerald as primary color (#10b981)
  - Replaced all blue color references with primary colors
  - Updated Button component variants to use primary color scheme
  - Unified focus states, hover states, and active states
  - Consistent color usage across landing, dashboard, auth, and navigation
  - Semantic colors adjusted: success (emerald), warning (amber), danger (red), info (cyan)

## [0.2.0] - 2025-05-27

### Added
- Initial project setup with React 18, TypeScript, Vite, and Tailwind CSS
- Basic PWA configuration with manifest and icons
- Supabase integration setup with database migrations
- Contact queue UI with mobile-first design
- Authentication flow with protected routes
- Dashboard and admin interfaces
- Cloudflare Pages deployment configuration
- Twilio telephony integration for anonymous calling
- Database schema for call sessions and transcripts
- Password reset functionality with email recovery
- User registration with organization creation
- Demo account functionality with pre-populated data
- "Try Demo Account" button on login page showing credentials
- Setup script to create demo user (npm run setup:demo)
- **Pathway Management System** - Create and track member journeys through engagement levels
  - Create custom pathways with multiple steps
  - Auto-enrollment based on tags and criteria
  - Track progress and completion rates
  - Automated engagement actions (email, SMS, tasks)
  - Integration with engagement tracking
- **Engagement Dashboard** - Comprehensive member engagement analytics
  - Real-time engagement metrics and trends
  - Member segmentation (highly engaged, moderate, low, inactive)
  - Engagement ladder tracking (supporter → volunteer → organizer → leader)
  - Campaign performance monitoring
  - Automated engagement workflows
- **Campaign Management** - ActionNetwork-style campaign creation and tracking
  - Multiple campaign types: petitions, events, fundraisers, phone banks, canvassing
  - Goal tracking and progress visualization
  - Participant and conversion metrics
  - Quick-start campaign templates
  - Social sharing integration
- **Enhanced Navigation** - Updated navigation with new features
  - Added Campaigns, Pathways, and Engagement to main navigation
  - Mobile-optimized tab bar with new sections
  - Improved desktop navigation
- **Tags Support** - Added comprehensive tagging system for contacts
  - Tag creation and management interface
  - Bulk tag operations
  - Tag-based filtering and search
- **CSV Export** - Export contact data to CSV format
  - Flexible field selection
  - Bulk export capabilities
- **Inline Editing** - Edit contact information directly in the contact list
  - Real-time updates
  - Improved user experience
- **Advanced Search** - Enhanced search functionality across contacts
  - Search by name, email, phone, and tags
  - Quick filtering options
- **Error Handling** - Improved error handling throughout the application
  - User-friendly error messages
  - Graceful fallbacks for failed operations
- **Rebranding** - Renamed app from "Contact Manager" to "rise.protest.net"
  - Updated app name and branding throughout the UI
  - Changed PWA manifest to reflect protest/mobilization focus
  - Added landing page with real screenshots
- **Landing Page** - Professional landing page with app screenshots
  - Hero section with clear call-to-action
  - Feature showcase with actual app screenshots
  - Benefits section highlighting organizing tools
  - Mobile-responsive design

### Changed
- Updated environment configuration for Supabase and Twilio
- Simplified authentication to use mock data for demo mode
- Replaced complex RLS policies with direct API calls
- Improved error handling to follow Postel's Law (be liberal in what you accept)

### Fixed
- Service worker registration issues
- Created missing offline.html page
- Fixed TypeScript compilation errors
- Removed unused imports
- Fixed app loading issues caused by stale service workers intercepting network requests
- Added service worker cleanup code to unregister old workers and clear caches on startup
- Resolved "Failed to convert value to 'Response'" errors in the browser console
- Temporarily disabled service worker registration until proper implementation is complete
- **Major Auth Fix** - Resolved authentication infinite loop and loading issues
  - Removed RLS policies causing recursive queries
  - Fixed database schema mismatch (full_name vs first_name/last_name)
  - Replaced Supabase client calls with direct REST API
  - Implemented defensive programming practices
- **Navigation Restoration** - Fixed missing navigation between app sections
  - Restored proper routing structure
  - Added Layout component wrapping for all pages
  - Fixed TabBar visibility on mobile
- **Authentication Flow** - Fixed login/logout functionality
  - Implemented stateful mock authentication with localStorage
  - Fixed redirect to dashboard after login
  - Fixed sign out functionality to properly clear session
  - Removed auto-login behavior to allow access to login form
- **Layout Improvements** - Optimized layout for larger screens
  - Fixed double Layout wrapping causing excessive whitespace
  - Reduced sidebar width for better content space utilization
  - Removed max-width constraints to use full screen width
  - Applied consistent padding across all main pages

### Security
- Added Row Level Security policies for all database tables
- Implemented secure credential storage for API keys