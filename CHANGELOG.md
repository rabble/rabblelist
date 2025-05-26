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

### Changed
- Updated environment configuration for Supabase and Twilio

### Fixed
- Service worker registration issues
- Created missing offline.html page
- Fixed TypeScript compilation errors
- Removed unused imports
- Fixed app loading issues caused by stale service workers intercepting network requests
- Added service worker cleanup code to unregister old workers and clear caches on startup
- Resolved "Failed to convert value to 'Response'" errors in the browser console
- Temporarily disabled service worker registration until proper implementation is complete

### Security
- Added Row Level Security policies for all database tables
- Implemented secure credential storage for API keys