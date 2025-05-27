import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ContactsPage } from './ContactsPage'
import { ContactQueue } from '@/features/contacts/ContactQueue'
import { ContactForm } from '@/features/contacts/ContactForm'
import { ContactDetail } from '@/features/contacts/ContactDetail'
import { ContactImport } from '@/features/contacts/ContactImport'
import { ContactDeduplication } from '@/features/contacts/ContactDeduplication'
import { TagsManagement } from '@/features/contacts/management/TagsManagement'
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
import { CampaignManagement } from '@/features/campaigns/CampaignManagement'
import { CampaignForm } from '@/features/campaigns/CampaignForm'
import { CampaignDetail } from '@/features/campaigns/CampaignDetail'
import { EmailCampaign } from '@/features/campaigns/EmailCampaign'
import { SMSCampaign } from '@/features/campaigns/SMSCampaign'
import { PhoneBankCampaign } from '@/features/campaigns/PhoneBankCampaign'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import LandingPage from '@/features/landing/LandingPage'
import AboutPage from '@/features/landing/AboutPage'
import EventRegistrationForm from '@/features/events/EventRegistrationForm'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
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
      <Route path="/events/:eventId/register" element={<EventRegistrationForm />} />
          
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
          
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Layout>
                <CampaignManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/new" element={
            <ProtectedRoute>
              <CampaignForm />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/edit" element={
            <ProtectedRoute>
              <CampaignForm />
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
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
      {/* Catch all - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App