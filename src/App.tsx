import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { ContactsPage } from './ContactsPage'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { EventsManagement } from '@/features/events/EventsManagement'
import { GroupsManagement } from '@/features/groups/GroupsManagement'
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