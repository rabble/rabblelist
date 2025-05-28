import { useContactStore } from '@/stores/contactStore'
import { useSync } from '@/hooks/useSync'
import { useContactQueue } from '@/hooks/useContactQueue'
import { ContactCard } from './ContactCard'
import { Layout } from '@/components/layout/Layout'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Wifi, WifiOff, Phone } from 'lucide-react'

export function ContactQueue() {
  // Load contacts
  useContactQueue()
  
  const { 
    queue, 
    currentIndex, 
    nextContact, 
    previousContact,
    updateContact,
    isLoadingQueue 
  } = useContactStore()
  
  const { pendingCount, isSyncing, isOnline } = useSync()
  const currentContact = queue[currentIndex]

  const handleComplete = () => {
    if (currentContact) {
      updateContact(currentContact.id, {
        last_contacted: new Date().toISOString()
      })
    }
  }

  if (isLoadingQueue) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading contacts...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (queue.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">No Contacts Available</h2>
            <p className="text-gray-600">
              There are no contacts ready to call right now. Here are some other ways you can help:
            </p>
            
            <div className="space-y-4 mt-8">
              <Link 
                to="/pathways" 
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Engagement Pathways
              </Link>
              
              <Link 
                to="/events" 
                className="block w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Check Upcoming Events
              </Link>
              
              <Link 
                to="/contacts" 
                className="block w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Import New Contacts
              </Link>
              
              <Link 
                to="/campaigns" 
                className="block w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Review Active Campaigns
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Tip: Contacts become available for calling after 30 days, or you can ask your organizer to assign specific contacts to you.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!currentContact) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">All Done!</h2>
            <p className="text-gray-600 max-w-xs mx-auto">
              You've completed all your assigned contacts. Great work!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh Queue
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Status Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isOnline ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {pendingCount > 0 && (
                <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                  <span className="text-sm font-medium">
                    {pendingCount} pending
                  </span>
                </div>
              )}
            </div>
            
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Contact {currentIndex + 1} of {queue.length}
              </h1>
              <p className="text-lg text-blue-600 font-semibold">
                {Math.round(((currentIndex + 1) / queue.length) * 100)}% Complete
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 pb-32">
          <ContactCard
            contact={currentContact}
            onComplete={handleComplete}
            onNext={nextContact}
          />
        </div>

        {/* Navigation Controls */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <button
              onClick={previousContact}
              disabled={currentIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-white border-2 border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(queue.length, 5) }).map((_, i) => {
                const dotIndex = Math.max(0, Math.min(currentIndex - 2 + i, queue.length - 1))
                return (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dotIndex === currentIndex 
                        ? 'w-6 bg-blue-600' 
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                )
              })}
            </div>
            
            <button
              onClick={nextContact}
              disabled={currentIndex >= queue.length - 1}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-white border-2 border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}