import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { PermissionGuard } from '@/features/auth/PermissionGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { ContactQueue } from '@/features/contacts/ContactQueue'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { ContactsManagement } from '@/features/contacts/management/ContactsManagement'
import { ContactForm } from '@/features/contacts/ContactForm'
import { ContactDetail } from '@/features/contacts/ContactDetail'
import { ContactImport } from '@/features/contacts/ContactImport'
import { EventsManagement } from '@/features/events/EventsManagement'
import { EventDetail } from '@/features/events/EventDetail'
import { EventForm } from '@/features/events/EventForm'
import { GroupsManagement } from '@/features/groups/GroupsManagement'
import { PathwaysManagement } from '@/features/pathways/PathwaysManagement'
import { AdminDashboard } from '@/features/admin/AdminDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
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
          
          {/* Add New Contact */}
          <Route
            path="/contacts/new"
            element={
              <ProtectedRoute>
                <ContactForm />
              </ProtectedRoute>
            }
          />
          
          {/* Contact Import */}
          <Route
            path="/contacts/import"
            element={
              <ProtectedRoute>
                <ContactImport />
              </ProtectedRoute>
            }
          />
          
          {/* Contact Detail */}
          <Route
            path="/contacts/:id"
            element={
              <ProtectedRoute>
                <ContactDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Edit Contact */}
          <Route
            path="/contacts/:id/edit"
            element={
              <ProtectedRoute>
                <ContactForm />
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
          
          {/* Create Event */}
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <EventForm />
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
          
          {/* Edit Event */}
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <EventForm />
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