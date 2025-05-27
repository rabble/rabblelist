# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Security
- Added Row Level Security policies for all database tables
- Implemented secure credential storage for API keys