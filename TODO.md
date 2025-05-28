# Rise.protest.net Development TODO

*Last updated: January 27, 2025*

## 🚨 Critical (Blocks Core Organizing)
*Features essential for basic organizing function*

### Contact Management
- [x] Basic contact CRUD operations
- [x] Contact import from CSV
- [x] Contact export to CSV
- [x] Bulk contact selection and deletion
- [x] Contact deduplication
- [x] Custom fields configuration
- [x] Contact search and filtering
- [x] Contact tags management
- [x] **Contact history timeline** - Complete interaction log with all activities
- [x] **Contact merge UI** - Visual interface for reviewing and merging duplicates
- [ ] **Bulk tag operations** - Add/remove tags from multiple contacts at once
- [ ] **Smart lists** - Dynamic contact lists based on criteria
- [ ] **Contact scoring** - Engagement scoring based on activities

### Communication Systems
- [x] **Email system integration** - Send emails directly from platform (Mailgun mock)
  - [x] Email service with campaign support
  - [x] Email campaign UI with preview
  - [x] Test email functionality
  - [ ] Email template editor with drag-and-drop
  - [ ] Email tracking (opens, clicks)
  - [ ] Bounce handling and list hygiene
  - [ ] Unsubscribe management
- [x] **SMS messaging** - Campaign SMS messaging via Twilio
  - [x] SMS service with Twilio integration
  - [x] Bulk SMS campaigns with personalization
  - [x] Character counting and segment calculation
  - [x] Media attachment support (MMS)
  - [ ] Two-way SMS conversations
  - [ ] Opt-out handling and compliance
  - [ ] Keyword response automation
- [x] **Phone banking system** - Basic calling interface
  - [x] Phone banking session management
  - [x] Call tracking and outcome recording
  - [x] Real-time script display during calls
  - [x] Session statistics and progress tracking
  - [ ] Actual VoIP integration (Twilio calling)
  - [ ] Click-to-call implementation
  - [ ] Call recording capabilities
  - [ ] Predictive dialing for efficiency

### Event Management
- [x] Basic event creation and listing
- [x] **Event registration forms** - Public signup pages
  - [x] Custom registration fields
  - [x] Capacity management and waitlists
  - [x] Auto-promotion from waitlist
  - [x] Registration export to CSV
  - [ ] Confirmation emails
  - [ ] Calendar integration (.ics files)
- [ ] **QR code check-in** - Mobile attendance tracking
  - [ ] Generate unique QR codes per attendee
  - [ ] Mobile check-in app/interface
  - [ ] Real-time attendance dashboard
  - [ ] Walk-in registration support
- [ ] **Event analytics** - Detailed event metrics
  - [ ] Attendance vs registration rates
  - [ ] No-show tracking
  - [ ] Post-event engagement metrics
  - [ ] Event ROI calculations
- [ ] **Recurring events** - Series and repeat patterns
- [ ] **Event reminders** - Automated SMS/email sequences

### Campaign Management
- [x] **Campaign creation** - Multi-type campaign support
  - [x] Campaign goal setting and tracking
  - [x] Support for petition, event, donation, email, phone bank, canvas, social
  - [x] Campaign templates with quick start
  - [x] Campaign timeline with start/end dates
- [x] **Campaign execution** - Launch and monitor campaigns
  - [x] Contact assignment to campaigns
  - [x] Real-time performance monitoring via stats
  - [x] Campaign status management (draft, active, completed)
  - [ ] A/B testing capabilities
  - [ ] Campaign pause/resume functionality
- [x] **Campaign analytics** - Basic reporting
  - [x] Key metrics dashboard (participants, conversions, shares)
  - [x] Channel performance tracking
  - [x] Progress toward goals visualization
  - [ ] Conversion funnel analysis
  - [ ] ROI and cost-per-action metrics

### Offline Functionality
- [x] Basic service worker implementation
- [x] IndexedDB schema setup
- [x] Basic sync service structure
- [ ] **Complete offline sync** - Full bidirectional sync
  - [ ] Sync queue persistence and retry logic
  - [ ] Conflict resolution UI
  - [ ] Background sync when reconnected
  - [ ] Sync progress indicators
  - [ ] Offline mode indicators throughout UI
  - [ ] Selective sync for large datasets
  - [ ] Sync error recovery and reporting

## 🔥 High Priority (Major UX Improvements)
*Features that significantly improve organizing effectiveness*

### Pathways (Engagement Ladders)
- [x] **Pathway builder** - Create multi-step engagement journeys
  - [x] Step creation with descriptions and requirements
  - [x] Dynamic step management (add/remove/reorder)
  - [x] Pathway templates for common journeys
  - [ ] Visual drag-and-drop editor
  - [ ] Branching logic based on contact behavior
  - [ ] Time-based progression rules
- [x] **Pathway assignment** - Add contacts to pathways
  - [x] Member assignment interface
  - [x] Progress tracking per member
  - [ ] Bulk pathway assignment
  - [ ] Automatic assignment based on triggers
  - [ ] Manual progression overrides
- [ ] **Pathway tracking** - Monitor member progress
  - [ ] Progress visualization per contact
  - [ ] Cohort analysis tools
  - [ ] Drop-off analysis and optimization
  - [ ] Pathway completion certificates
- [ ] **Pathway automation** - Triggered actions
  - [ ] Automatic emails at each step
  - [ ] Task creation for organizers
  - [ ] Tag updates based on progress
  - [ ] Integration with campaigns

### Fundraising
- [ ] **Donation form builder** - Embeddable forms
  - [ ] Customizable donation amounts
  - [ ] Recurring donation options
  - [ ] Tribute/memorial donations
  - [ ] Employer matching integration
- [ ] **Payment processing** - Secure transactions
  - [ ] Stripe integration
  - [ ] PayPal support
  - [ ] ACH/bank transfer options
  - [ ] International payment support
- [ ] **Donor management** - Stewardship tools
  - [ ] Donation history tracking
  - [ ] Tax receipt generation
  - [ ] Major donor flagging
  - [ ] Pledge tracking
- [ ] **Fundraising campaigns** - Goal-based campaigns
  - [ ] Thermometer widgets
  - [ ] Peer-to-peer fundraising
  - [ ] Matching gift campaigns
  - [ ] Time-based campaigns

### Petitions & Actions
- [x] **Petition system** - Public petition signing
  - [x] Public petition signing pages
  - [x] Signature validation and duplicate prevention  
  - [x] Real-time signature counter
  - [x] Recent signatures display with privacy controls
  - [x] Geographic analysis by zip code
  - [x] Social sharing integration
  - [x] Signature export to CSV
  - [x] Auto-create contacts from signatures
- [ ] **Advanced petition features**
  - [ ] Custom form fields
  - [ ] Target selection (legislators, companies)
  - [ ] Signature goals and thermometers
  - [ ] Social sharing tools
- [ ] **Signature collection** - Gather support
  - [ ] Embedded petition widgets
  - [ ] Mobile-optimized forms
  - [ ] Duplicate detection
  - [ ] Geographic validation
- [ ] **Petition delivery** - Send to targets
  - [ ] Automated delivery rules
  - [ ] Batch delivery options
  - [ ] Delivery confirmation tracking
  - [ ] Target response logging
- [ ] **Action alerts** - Rapid mobilization
  - [ ] Urgent action notifications
  - [ ] One-click actions
  - [ ] Action tracking and reporting

### Cloud Telephony Integration with AI Transcription
**Goal**: Enable anonymous calling where ringers don't see contact numbers and calls are automatically transcribed, analyzed, and logged.

#### Research & Planning Phase
- [ ] Evaluate telephony providers:
  - [ ] **Twilio** (Recommended): Test Proxy API for masked calling, Voice Insights API
  - [ ] **Amazon Connect**: Evaluate all-in-one solution with built-in transcription
  - [ ] **Vonage**: Test Voice API and Number Masking features
  - [ ] Compare pricing models for expected call volume

- [ ] Evaluate transcription services:
  - [ ] **Google Cloud Speech-to-Text**: Test telephony model, evaluate 125+ language support
  - [ ] **Amazon Transcribe**: Test real-time transcription with Amazon Connect
  - [ ] **AssemblyAI**: Evaluate real-time WebSocket API (<600ms latency)
  - [ ] **Deepgram**: Test Voice AI platform for real-time transcription
  
- [ ] Evaluate LLM integration for call analysis:
  - [ ] **OpenAI GPT-4o-mini-realtime**: Test for real-time call analysis
  - [ ] **Claude 3.7 Sonnet**: Evaluate for post-call comprehensive analysis
  - [ ] Design prompts for extracting: sentiment, key topics, follow-up actions, call outcome

#### Architecture Design
- [ ] Design system architecture:
  ```
  User clicks "Call" → Twilio Proxy creates masked connection → 
  Call audio streams to transcription service → 
  Real-time transcript to LLM → 
  Call summary & outcomes saved to Supabase
  ```
- [ ] Plan database schema extensions:
  - [ ] `call_sessions` table: session_id, caller_id, contact_id, start_time, duration, recording_url
  - [ ] `call_transcripts` table: transcript_id, session_id, language, raw_text, timestamps
  - [ ] `call_analytics` table: session_id, sentiment, key_topics[], outcome, follow_up_actions[]
  - [ ] Update `contact_interactions` to link with call_sessions

#### Implementation Phase 1: Basic Anonymous Calling
- [ ] Set up Twilio account and configure:
  - [ ] Purchase phone numbers for each supported country
  - [ ] Configure Proxy service for number masking
  - [ ] Set up Voice webhooks for call events
  - [ ] Implement JWT authentication for client SDK

- [ ] Create calling UI components:
  - [ ] In-app dialer interface with call controls
  - [ ] Call status indicators (connecting, in-progress, ended)
  - [ ] Mute, speaker, end call buttons
  - [ ] Call duration timer
  - [ ] Post-call feedback form

- [ ] Implement backend calling service:
  - [ ] Cloudflare Worker for Twilio webhook handling
  - [ ] Session management for active calls
  - [ ] Call routing logic based on user location
  - [ ] Rate limiting and fraud prevention

#### Implementation Phase 2: Real-time Transcription
- [ ] Integrate transcription service:
  - [ ] Set up Google Cloud Speech-to-Text API
  - [ ] Configure streaming transcription for live calls
  - [ ] Handle multiple language detection
  - [ ] Implement fallback transcription service

- [ ] Create real-time UI features:
  - [ ] Live transcript display during calls
  - [ ] Language indicator
  - [ ] Confidence scores for transcription
  - [ ] Speaker diarization (who said what)

- [ ] Build transcription pipeline:
  - [ ] Audio streaming from Twilio to transcription service
  - [ ] WebSocket connection for real-time updates
  - [ ] Transcript storage and versioning
  - [ ] Post-call transcript cleanup and formatting

#### Implementation Phase 3: AI Analysis & Automation
- [ ] Implement LLM analysis pipeline:
  - [ ] Real-time analysis using GPT-4o-mini for immediate insights
  - [ ] Post-call comprehensive analysis with Claude 3.7
  - [ ] Sentiment analysis throughout the call
  - [ ] Key topic extraction
  - [ ] Automatic outcome classification

- [ ] Create automation features:
  - [ ] Auto-fill call outcome based on AI analysis
  - [ ] Suggested follow-up actions
  - [ ] Automatic tag assignment based on conversation
  - [ ] Next call scheduling recommendations
  - [ ] Alert generation for important mentions

- [ ] Build AI-powered features:
  - [ ] Call summary generation
  - [ ] Action items extraction
  - [ ] Sentiment trend analysis
  - [ ] Conversation quality scoring
  - [ ] Coaching suggestions for ringers

#### Implementation Phase 4: Multi-language Support
- [ ] Configure language support:
  - [ ] Set up transcription for top 20 languages initially
  - [ ] Implement language detection
  - [ ] Configure LLM prompts in multiple languages
  - [ ] Handle code-switching (multiple languages in one call)

- [ ] Localization features:
  - [ ] Translate call summaries
  - [ ] Multi-language UI for call interface
  - [ ] RTL support for applicable languages
  - [ ] Culturally appropriate AI responses

#### Implementation Phase 5: Analytics & Reporting
- [ ] Create analytics dashboard:
  - [ ] Call volume by ringer, time, outcome
  - [ ] Average call duration and sentiment
  - [ ] Language distribution
  - [ ] Conversion rates by call script
  - [ ] Ringer performance metrics

- [ ] Build reporting features:
  - [ ] Exportable call reports
  - [ ] Transcription search across all calls
  - [ ] Trend analysis over time
  - [ ] A/B testing for call scripts
  - [ ] ROI calculations for calling campaigns

#### Security & Compliance
- [ ] Implement security measures:
  - [ ] End-to-end encryption for calls
  - [ ] Secure storage for recordings/transcripts
  - [ ] Access control for sensitive data
  - [ ] Audit logs for all call access

- [ ] Ensure compliance:
  - [ ] GDPR compliance for EU calls
  - [ ] CCPA compliance for California
  - [ ] TCPA compliance for US calling
  - [ ] Local telecom regulations per country
  - [ ] Consent recording mechanisms

## 🛐 Technical Debt
*Infrastructure and code quality improvements*

### Performance Optimization
- [ ] **Database query optimization**
  - [ ] Add proper indexes for common queries
  - [ ] Implement query result caching
  - [ ] Optimize N+1 query problems
  - [ ] Database connection pooling
- [ ] **Frontend performance**
  - [ ] Implement code splitting
  - [ ] Add lazy loading for routes
  - [ ] Optimize bundle size
  - [ ] Image optimization and lazy loading
  - [ ] Virtual scrolling for large lists
- [ ] **API optimization**
  - [ ] Implement proper pagination everywhere
  - [ ] Add request debouncing
  - [ ] Response caching strategies
  - [ ] Rate limiting implementation

### Code Quality
- [ ] **Testing infrastructure**
  - [ ] Add integration tests for API calls
  - [ ] E2E tests for critical workflows
  - [ ] Visual regression testing
  - [ ] Performance benchmarking
  - [ ] Load testing setup
- [ ] **Error handling**
  - [ ] Global error boundary implementation
  - [ ] Sentry or similar error tracking
  - [ ] User-friendly error messages
  - [ ] Error recovery mechanisms
- [ ] **TypeScript improvements**
  - [ ] Strict type checking everywhere
  - [ ] Remove all 'any' types
  - [ ] Proper API response typing
  - [ ] Type-safe database queries

### Security
- [ ] **Authentication hardening**
  - [ ] 2FA/MFA support
  - [ ] Session timeout controls
  - [ ] Password complexity requirements
  - [ ] Account lockout policies
- [ ] **Data security**
  - [ ] Field-level encryption for PII
  - [ ] Audit logging for all actions
  - [ ] GDPR compliance tools
  - [ ] Data retention policies
- [ ] **API security**
  - [ ] API rate limiting
  - [ ] Request validation
  - [ ] CORS configuration
  - [ ] CSP headers

### Documentation
- [ ] **Developer documentation**
  - [ ] API documentation
  - [ ] Architecture diagrams
  - [ ] Setup guides
  - [ ] Contributing guidelines
- [ ] **User documentation**
  - [ ] Feature guides
  - [ ] Video tutorials
  - [ ] FAQ section
  - [ ] Troubleshooting guides

## 🚀 Implementation Priorities

### Phase 1: Core Communications (Weeks 1-4)
1. Email system integration
2. SMS messaging capabilities
3. Basic phone banking UI

### Phase 2: Events & Campaigns (Weeks 5-8)
1. Event registration system
2. Campaign management implementation
3. Basic petition functionality

### Phase 3: Engagement & Analytics (Weeks 9-12)
1. Pathways implementation
2. Enhanced analytics
3. Automated workflows

### Phase 4: Advanced Features (Weeks 13-16)
1. Fundraising integration
2. Advanced phone banking
3. AI-powered features

## 📊 Current Platform Status

### What's Working
- ✅ Basic contact management (CRUD, import/export)
- ✅ User authentication and multi-org support
- ✅ Basic dashboard and analytics
- ✅ Contact deduplication
- ✅ Basic event creation
- ✅ PWA manifest and service worker

### What's Partially Complete
- 🔶 Offline sync (structure exists, not fully functional)
- 🔶 Call queue (UI only, no actual calling)
- 🔶 Events (no registration or check-in)
- 🔶 Admin dashboard (stats only, no user management)

### What's Missing
- ❌ All communication features (email, SMS, calling)
- ❌ Campaign management (UI mockup only)
- ❌ Pathways/engagement ladders (UI mockup only)
- ❌ Fundraising capabilities
- ❌ Petition/action tools
- ❌ Push notifications
- ❌ Automated workflows
- ❌ Advanced analytics
- ❌ AI features

### Completion Estimate: ~35% of full platform vision

## 📈 Medium Priority (Quality of Life)
*Improvements that enhance user experience*

### Multi-Organization Support
- [x] Basic multi-org data isolation
- [x] Organization switching UI
- [ ] **Coalition features** - Cross-org collaboration
  - [ ] Shared campaigns across orgs
  - [ ] Coalition-wide analytics
  - [ ] Resource sharing permissions
  - [ ] Joint event management

### Analytics & Reporting
- [x] Basic dashboard with stats
- [ ] **Custom dashboards** - User-configurable views
  - [ ] Drag-and-drop widget placement
  - [ ] Custom metric definitions
  - [ ] Saved dashboard templates
  - [ ] Role-based dashboards
- [ ] **Advanced analytics** - Deep insights
  - [ ] Cohort analysis tools
  - [ ] Predictive modeling
  - [ ] Engagement scoring algorithms
  - [ ] Geographic heat maps
- [ ] **Automated reports** - Scheduled delivery
  - [ ] Email report subscriptions
  - [ ] Custom report builder
  - [ ] PDF generation
  - [ ] Data export APIs

### User Management
- [ ] **Complete admin panel** - Full user control
  - [ ] User creation and invitation flow
  - [ ] Role and permission management UI
  - [ ] User activity logs
  - [ ] Bulk user operations
  - [ ] User deactivation/reactivation
- [ ] **Team management** - Organizing structure
  - [ ] Team/department creation
  - [ ] Team leader assignment
  - [ ] Team-based permissions
  - [ ] Team performance metrics

### Mobile & PWA Enhancements
- [x] Basic PWA manifest and service worker
- [ ] **Enhanced offline support**
  - [ ] Full offline mode for all features
  - [ ] Smart caching strategies
  - [ ] Background sync for all data types
  - [ ] Offline form submission queue
- [ ] **Mobile optimizations**
  - [ ] Touch gesture support
  - [ ] Mobile-specific UI components
  - [ ] Reduced data usage mode
  - [ ] Native app features (camera, location)
- [ ] **Push notifications**
  - [ ] Web push implementation
  - [ ] Notification preferences
  - [ ] Rich notifications with actions
  - [ ] Notification analytics

## 🔮 Future Enhancements
*Advanced features for later development*

### AI & Automation
- [ ] **Smart contact scoring** - AI-powered insights
  - [ ] Engagement prediction models
  - [ ] Leadership identification
  - [ ] Churn risk detection
  - [ ] Next best action suggestions
- [ ] **Automated workflows** - Complex automation
  - [ ] Visual workflow builder
  - [ ] Conditional logic trees
  - [ ] Multi-step automations
  - [ ] Integration with external tools
- [ ] **AI communication assistant**
  - [ ] Message drafting suggestions
  - [ ] Optimal send time prediction
  - [ ] Subject line optimization
  - [ ] Response likelihood scoring

### Advanced Organizing
- [ ] **Distributed organizing** - Peer-to-peer tools
  - [ ] Volunteer-led event creation
  - [ ] Peer texting capabilities
  - [ ] Social media amplification
  - [ ] Friend-to-friend outreach
- [ ] **Electoral integration** - Voter engagement
  - [ ] Voter file matching
  - [ ] VAN integration
  - [ ] Polling location info
  - [ ] Ballot tracking
- [ ] **Direct action tools** - Protest coordination
  - [ ] Real-time coordination maps
  - [ ] Legal support integration
  - [ ] Safety check-ins
  - [ ] Media contact management

## 🎯 Feature Completion

### 8. Events Management
- [ ] Complete event creation form
- [ ] Add event editing functionality
- [ ] Implement event deletion
- [ ] Create event RSVP system
- [ ] Add check-in functionality with QR codes
- [ ] Implement attendance tracking
- [ ] Add event reminders/notifications
- [ ] Create recurring events support
- [ ] Add event analytics/reports
- [ ] Implement event capacity management

### 9. Groups/Units Management
- [ ] Create group CRUD operations UI
- [ ] Add member management interface
- [ ] Implement group hierarchy visualization
- [ ] Add bulk member operations
- [ ] Create group communication features
- [ ] Add group analytics
- [ ] Implement group-based permissions

### 10. Pathways/Engagement Tracking
- [ ] Design and implement pathways UI
- [ ] Add pathway progress tracking
- [ ] Create milestone definitions
- [ ] Implement automated pathway advancement
- [ ] Add pathway analytics
- [ ] Create pathway templates

### 11. Admin Dashboard
- [ ] Implement complete user management
- [ ] Add organization settings UI
- [ ] Create billing/subscription management
- [ ] Add system health monitoring
- [ ] Implement audit logs
- [ ] Add data export tools
- [ ] Create custom report builder
- [ ] Add API key management

## 🔧 Technical Debt & Infrastructure

### 12. Database & API
- [ ] Run and verify all Supabase migrations
- [ ] Set up proper RLS policies
- [ ] Create database indexes for performance
- [ ] Implement API rate limiting
- [ ] Add request caching
- [ ] Create data validation schemas
- [ ] Implement proper pagination

### 13. State Management
- [ ] Complete all Zustand stores implementation
- [ ] Add proper TypeScript types for all stores
- [ ] Implement store persistence
- [ ] Add store dev tools integration
- [ ] Create store testing utilities

### 14. Error Handling & Logging
- [ ] Implement global error boundary
- [ ] Add error reporting service integration
- [ ] Create user-friendly error messages
- [ ] Add debug logging system
- [ ] Implement analytics tracking

### 15. Testing
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Add unit tests for critical functions
- [ ] Create integration tests for API calls
- [ ] Add E2E tests for critical user flows
- [ ] Implement visual regression testing
- [ ] Add performance testing

### 16. Performance Optimization
- [ ] Implement code splitting for routes
- [ ] Add lazy loading for components
- [ ] Optimize bundle size
- [ ] Add image optimization
- [ ] Implement request debouncing
- [ ] Add data virtualization for large lists

## 🎨 UI/UX Polish

### 17. UI Consistency
- [ ] Create consistent loading states
- [ ] Add proper empty states with CTAs
- [ ] Implement consistent error states
- [ ] Add success feedback animations
- [ ] Create consistent form validation
- [ ] Implement proper focus management

### 18. Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works everywhere
- [ ] Add screen reader announcements
- [ ] Implement high contrast mode
- [ ] Add focus indicators
- [ ] Ensure color contrast meets WCAG standards

### 19. Animations & Transitions
- [ ] Add page transition animations
- [ ] Implement micro-interactions
- [ ] Add loading animations
- [ ] Create smooth scroll behaviors
- [ ] Add gesture animations

## 📚 Documentation & Deployment

### 20. Documentation
- [ ] Complete API documentation
- [ ] Add code comments for complex logic
- [ ] Create user guide
- [ ] Add deployment guide
- [ ] Create contributor guidelines
- [ ] Add architecture decision records

### 21. Deployment & DevOps
- [ ] Set up proper environment variables
- [ ] Configure Cloudflare Workers deployment
- [ ] Add CI/CD pipeline
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies
- [ ] Add performance monitoring
- [ ] Set up error tracking

### 22. Security
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up CSP headers
- [ ] Implement HTTPS everywhere
- [ ] Add security headers
- [ ] Create security audit process
- [ ] Implement 2FA support

## 🚀 Launch Preparation

### 23. Beta Testing
- [ ] Create beta testing plan
- [ ] Set up feedback collection
- [ ] Implement feature flags
- [ ] Add usage analytics
- [ ] Create bug reporting flow

### 24. Production Readiness
- [ ] Performance audit and optimization
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Device testing (iOS, Android)
- [ ] Load testing
- [ ] Create rollback plan

## 📝 Notes

- Every "mock" reference in code needs to be replaced with real implementation
- All placeholder text needs real copy
- All TODO comments in code need to be addressed
- Ensure no console.logs remain in production code
- All API keys must be properly secured
- Implement proper data validation everywhere

## Priority Order

1. **P0 (Do First)**: Authentication, Supabase integration, Contact CRUD
2. **P1 (Core Features)**: Offline sync, Call queue, PWA setup
3. **P2 (Important)**: Events, Groups, Admin dashboard
4. **P3 (Nice to Have)**: Advanced analytics, Pathways, Polish

This is a production app - no shortcuts, no "this would be done in a real app" comments!