import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ContactsPage } from './ContactsPage'
import { ContactQueue } from '@/features/contacts/ContactQueue'
import { ContactForm } from '@/features/contacts/ContactForm'
import { ContactDetail } from '@/features/contacts/ContactDetail'
import { ContactImport } from '@/features/contacts/ContactImport'
import { ContactDeduplication } from '@/features/contacts/ContactDeduplication'
import { TagsManagement } from '@/features/contacts/management/TagsManagement'
import { SmartLists } from '@/features/contacts/SmartLists'
import { ContactScoring } from '@/features/contacts/ContactScoring'
import { EventForm } from '@/features/events/EventForm'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { EventsManagement } from '@/features/events/EventsManagement'
import { EventDetail } from '@/features/events/EventDetail'
import { GroupsManagement } from '@/features/groups/GroupsManagement'
import { GroupForm } from '@/features/groups/GroupForm'
import { GroupMembers } from '@/features/groups/GroupMembers'
import { GroupAddMembers } from '@/features/groups/GroupAddMembers'
import { PathwaysManagement } from '@/features/pathways/PathwaysManagement'
import { PathwayForm } from '@/features/pathways/PathwayForm'
import { PathwayMembers } from '@/features/pathways/PathwayMembers'
import { CampaignAnalytics } from '@/features/campaigns/CampaignAnalytics'
import { EngagementDashboard } from '@/features/engagement/EngagementDashboard'
import { AllActivities } from '@/features/engagement/AllActivities'
import { AutomationIntegrations } from '@/features/automation/AutomationIntegrations'
import { WebhookManagement } from '@/features/automation/WebhookManagement'
import { WebhookTester } from '@/features/automation/WebhookTester'
import { ApiDocumentation } from '@/features/docs/ApiDocumentation'
import { N8nIntegrationGuide } from '@/features/docs/N8nIntegrationGuide'
import { CampaignManagement } from '@/features/campaigns/CampaignManagement'
import { CampaignFormEnhanced } from '@/features/campaigns/CampaignFormEnhanced'
import { CampaignDetail } from '@/features/campaigns/CampaignDetail'
import { EmailCampaign } from '@/features/campaigns/EmailCampaign'
import { SMSCampaign } from '@/features/campaigns/SMSCampaign'
import { PhoneBankCampaign } from '@/features/campaigns/PhoneBankCampaign'
import { EmailTrackingDashboard } from '@/features/campaigns/EmailTrackingDashboard'
import { PetitionSign } from '@/features/campaigns/PetitionSign'
import { SmsTemplates } from '@/features/campaigns/SmsTemplates'
import { PhoneBankScripts } from '@/features/campaigns/PhoneBankScripts'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { CustomFieldsConfig } from '@/features/admin/CustomFieldsConfig'
import { UserForm } from '@/features/admin/UserForm'
import { OrganizationInvite } from '@/features/admin/OrganizationInvite'
import { APIKeysManagement } from '@/features/admin/APIKeysManagement'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import LandingPage from '@/features/landing/LandingPage'
import AboutPage from '@/features/landing/AboutPage'
import { TermsOfService } from '@/features/legal/TermsOfService'
import { PrivacyPolicy } from '@/features/legal/PrivacyPolicy'
import EventRegistrationForm from '@/features/events/EventRegistrationForm'
import { EventCheckIn } from '@/features/events/EventCheckIn'
import { EventAttendanceDashboard } from '@/features/events/EventAttendanceDashboard'
import { EventWalkInRegistration } from '@/features/events/EventWalkInRegistration'

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </Sentry.ErrorBoundary>
  )
}

// Error fallback component
function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We've encountered an unexpected error. Our team has been notified and we're working on a fix.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

// Separate component that can use useAuth
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/events/:eventId/register" element={<EventRegistrationForm />} />
      <Route path="/events/:eventId/check-in/:registrationId" element={<EventCheckIn />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/contacts" element={
            <ProtectedRoute>
              <Layout>
                <ContactsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/queue" element={
            <ProtectedRoute>
              <ContactQueue />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/new" element={
            <ProtectedRoute>
              <ContactForm />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/:id" element={
            <ProtectedRoute>
              <ContactDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/:id/edit" element={
            <ProtectedRoute>
              <ContactForm />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/import" element={
            <ProtectedRoute>
              <ContactImport />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/deduplicate" element={
            <ProtectedRoute>
              <ContactDeduplication />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/tags" element={
            <ProtectedRoute>
              <TagsManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/smart-lists" element={
            <ProtectedRoute>
              <SmartLists />
            </ProtectedRoute>
          } />
          
          <Route path="/contacts/scoring" element={
            <ProtectedRoute>
              <ContactScoring />
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute>
              <Layout>
                <EventsManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/events/new" element={
            <ProtectedRoute>
              <EventForm />
            </ProtectedRoute>
          } />
          
          <Route path="/events/:id" element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/events/:id/edit" element={
            <ProtectedRoute>
              <EventForm />
            </ProtectedRoute>
          } />
          
          <Route path="/events/:id/attendance" element={
            <ProtectedRoute>
              <EventAttendanceDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/events/:id/check-in/walk-in" element={
            <ProtectedRoute>
              <EventWalkInRegistration />
            </ProtectedRoute>
          } />
          
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout>
                <GroupsManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/groups/new" element={
            <ProtectedRoute>
              <GroupForm />
            </ProtectedRoute>
          } />
          
          <Route path="/groups/:id/edit" element={
            <ProtectedRoute>
              <GroupForm />
            </ProtectedRoute>
          } />
          
          <Route path="/groups/:id/members" element={
            <ProtectedRoute>
              <GroupMembers />
            </ProtectedRoute>
          } />
          
          <Route path="/groups/:id/add-members" element={
            <ProtectedRoute>
              <GroupAddMembers />
            </ProtectedRoute>
          } />
          
          <Route path="/pathways" element={
            <ProtectedRoute>
              <Layout>
                <PathwaysManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/pathways/new" element={
            <ProtectedRoute>
              <PathwayForm />
            </ProtectedRoute>
          } />
          <Route path="/pathways/:id/edit" element={
            <ProtectedRoute>
              <PathwayForm />
            </ProtectedRoute>
          } />
          
          <Route path="/pathways/:id/members" element={
            <ProtectedRoute>
              <PathwayMembers />
            </ProtectedRoute>
          } />
          
          <Route path="/engagement" element={
            <ProtectedRoute>
              <Layout>
                <EngagementDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/engagement/activities" element={
            <ProtectedRoute>
              <AllActivities />
            </ProtectedRoute>
          } />
          
          <Route path="/engagement/automations" element={
            <ProtectedRoute>
              <AutomationIntegrations />
            </ProtectedRoute>
          } />
          
          <Route path="/automation/webhooks" element={
            <ProtectedRoute>
              <WebhookManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/automation/webhooks/test" element={
            <ProtectedRoute>
              <WebhookTester />
            </ProtectedRoute>
          } />
          
          <Route path="/docs/api" element={
            <ProtectedRoute>
              <ApiDocumentation />
            </ProtectedRoute>
          } />
          
          <Route path="/docs/integrations/n8n" element={
            <ProtectedRoute>
              <N8nIntegrationGuide />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Layout>
                <CampaignManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/new" element={
            <ProtectedRoute>
              <CampaignFormEnhanced />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/edit" element={
            <ProtectedRoute>
              <CampaignFormEnhanced />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id" element={
            <ProtectedRoute>
              <CampaignDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/email" element={
            <ProtectedRoute>
              <Layout>
                <EmailCampaign />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/email/tracking" element={
            <ProtectedRoute>
              <Layout>
                <EmailTrackingDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/sms" element={
            <ProtectedRoute>
              <Layout>
                <SMSCampaign />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/analytics" element={
            <ProtectedRoute>
              <Layout>
                <CampaignAnalytics />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/phonebank" element={
            <ProtectedRoute>
              <Layout>
                <PhoneBankCampaign />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/sms-templates" element={
            <ProtectedRoute>
              <Layout>
                <SmsTemplates />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/phonebank-scripts" element={
            <ProtectedRoute>
              <Layout>
                <PhoneBankScripts />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/sign" element={
            <PetitionSign />
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users/new" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/custom-fields" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <CustomFieldsConfig />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/invite" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <OrganizationInvite />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/api-keys" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <APIKeysManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
      {/* Catch all - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App