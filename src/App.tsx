import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { ContactQueue } from '@/features/contacts/ContactQueue'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { ContactsManagement } from '@/features/contacts/management/ContactsManagement'
import { EventsManagement } from '@/features/events/EventsManagement'
import { EventDetail } from '@/features/events/EventDetail'
import { GroupsManagement } from '@/features/groups/GroupsManagement'
import { PathwaysManagement } from '@/features/pathways/PathwaysManagement'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
      })
    }
  }, [])

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Contact Management */}
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <ContactsManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Contact Queue for calling */}
          <Route
            path="/contacts/queue"
            element={
              <ProtectedRoute>
                <ContactQueue />
              </ProtectedRoute>
            }
          />
          
          {/* Events Management */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Event Detail */}
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Groups Management */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Pathways Management */}
          <Route
            path="/pathways"
            element={
              <ProtectedRoute>
                <PathwaysManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Unauthorized
                  </h1>
                  <p className="text-gray-600">
                    You don't have permission to access this page.
                  </p>
                </div>
              </div>
            }
          />
          
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Page Not Found
                  </h1>
                  <p className="text-gray-600">
                    The page you're looking for doesn't exist.
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App