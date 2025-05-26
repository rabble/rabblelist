import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ContactsPage } from './ContactsPage'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { EventsManagement } from '@/features/events/EventsManagement'
import { GroupsManagement } from '@/features/groups/GroupsManagement'
import { PathwaysManagement } from '@/features/pathways/PathwaysManagement'
import { PathwayForm } from '@/features/pathways/PathwayForm'
import { EngagementDashboard } from '@/features/engagement/EngagementDashboard'
import { CampaignManagement } from '@/features/campaigns/CampaignManagement'
import { AdminDashboard } from '@/features/admin/AdminDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Redirect root to contacts */}
          <Route path="/" element={<Navigate to="/contacts" replace />} />
          
          {/* Main pages with layout */}
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          
          <Route path="/contacts" element={
            <Layout>
              <ContactsPage />
            </Layout>
          } />
          
          <Route path="/events" element={
            <Layout>
              <EventsManagement />
            </Layout>
          } />
          
          <Route path="/groups" element={
            <Layout>
              <GroupsManagement />
            </Layout>
          } />
          
          <Route path="/pathways" element={
            <Layout>
              <PathwaysManagement />
            </Layout>
          } />
          
          <Route path="/pathways/new" element={<PathwayForm />} />
          <Route path="/pathways/:id/edit" element={<PathwayForm />} />
          
          <Route path="/engagement" element={
            <Layout>
              <EngagementDashboard />
            </Layout>
          } />
          
          <Route path="/campaigns" element={
            <Layout>
              <CampaignManagement />
            </Layout>
          } />
          
          <Route path="/admin" element={
            <Layout>
              <AdminDashboard />
            </Layout>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/contacts" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App