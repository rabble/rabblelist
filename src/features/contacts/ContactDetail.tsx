import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { ContactService } from './contacts.service'
import { useAuth } from '@/features/auth/AuthContext'
import { 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Voicemail
} from 'lucide-react'
import type { Contact, CallLog } from '@/types'

export function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [contact, setContact] = useState<Contact | null>(null)
  const [callHistory, setCallHistory] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadContact()
      loadCallHistory()
    }
  }, [id])

  const loadContact = async () => {
    if (!id) return
    
    try {
      const { data, error } = await ContactService.getContact(id)
      
      if (error || !data) {
        alert('Contact not found')
        navigate('/contacts')
        return
      }
      
      setContact(data)
    } catch (error) {
      console.error('Error loading contact:', error)
      alert('Failed to load contact')
      navigate('/contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCallHistory = async () => {
    if (!id) return
    
    try {
      const { data } = await ContactService.getCallHistory(id)
      setCallHistory(data || [])
    } catch (error) {
      console.error('Error loading call history:', error)
    }
  }

  const handleDelete = async () => {
    if (!contact || !confirm(`Delete contact ${contact.full_name}?`)) return
    
    setIsDeleting(true)
    try {
      const { error } = await ContactService.deleteContact(contact.id)
      
      if (error) {
        alert('Failed to delete contact')
      } else {
        navigate('/contacts')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'answered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'voicemail':
        return <Voicemail className="w-4 h-4 text-orange-600" />
      case 'no_answer':
      case 'wrong_number':
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Phone className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  if (!contact) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Contact not found</p>
          <Button onClick={() => navigate('/contacts')} className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {contact.full_name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {contact.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/contacts/${contact.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-gray-900 hover:text-blue-600 mt-1"
                  >
                    <Phone className="w-4 h-4" />
                    {formatPhone(contact.phone)}
                  </a>
                </div>

                {/* Email */}
                {contact.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-gray-900 hover:text-blue-600 mt-1"
                    >
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  </div>
                )}

                {/* Address */}
                {contact.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="flex items-start gap-2 text-gray-900 mt-1">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span className="whitespace-pre-line">{contact.address}</span>
                    </p>
                  </div>
                )}

                {/* Last Contact */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Contact</label>
                  <p className="flex items-center gap-2 text-gray-900 mt-1">
                    <Calendar className="w-4 h-4" />
                    {contact.last_contact_date 
                      ? new Date(contact.last_contact_date).toLocaleDateString()
                      : 'Never contacted'
                    }
                  </p>
                </div>

                {/* Events Attended */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Events Attended</label>
                  <p className="text-gray-900 mt-1">
                    {contact.total_events_attended}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  fullWidth
                  onClick={() => window.location.href = `tel:${contact.phone}`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Contact
                </Button>
                {contact.email && (
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => window.location.href = `mailto:${contact.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => navigate(`/contacts/queue?contact=${contact.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add to Call Queue
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Call History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                {callHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No call history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callHistory.map((call) => (
                      <div 
                        key={call.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getOutcomeIcon(call.outcome)}
                            <div>
                              <div className="font-medium text-gray-900 capitalize">
                                {call.outcome.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(call.called_at).toLocaleString()}
                              </div>
                              {call.ringer && (
                                <div className="text-sm text-gray-500 mt-1">
                                  <User className="w-3 h-3 inline mr-1" />
                                  {call.ringer.full_name}
                                </div>
                              )}
                            </div>
                          </div>
                          {call.duration_seconds && (
                            <span className="text-sm text-gray-500">
                              {Math.floor(call.duration_seconds / 60)}:
                              {(call.duration_seconds % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        {call.notes && (
                          <p className="text-sm text-gray-700 mt-3 pl-7">
                            {call.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(contact.custom_fields).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-gray-900 mt-1">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}