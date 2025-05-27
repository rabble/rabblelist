import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
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
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import LandingPage from '@/features/landing/LandingPage'

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
  const { user, loading } = useAuth()
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        loading ? <div>Loading...</div> : 
        user ? <Navigate to="/dashboard" replace /> : 
        <LandingPage />
      } />
      <Route path="/login" element={<LoginPage />} />
          
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
          
          <Route path="/events" element={
            <ProtectedRoute>
              <Layout>
                <EventsManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout>
                <GroupsManagement />
              </Layout>
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