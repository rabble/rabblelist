import { useState } from 'react'
import { Phone, Check, X, Voicemail, Clock, Calendar } from 'lucide-react'
import type { Contact, CallOutcome } from '@/types'
import { ContactService } from './contacts.service'
import { formatDistanceToNow } from '@/lib/utils'
import * as idb from '@/lib/indexeddb'
import { CallDialog } from '../telephony/components/CallDialog'
import { telephonyService } from '../telephony/telephony.service'

interface ContactCardProps {
  contact: Contact
  onComplete: () => void
  onNext: () => void
}

export function ContactCard({ contact, onComplete, onNext }: ContactCardProps) {
  const [outcome, setOutcome] = useState<CallOutcome | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [isTelephonyAvailable, setIsTelephonyAvailable] = useState(false)

  const handleOutcomeSelect = (selectedOutcome: CallOutcome) => {
    setOutcome(selectedOutcome)
  }

  const handleSave = async () => {
    if (!outcome) return
    
    setIsSaving(true)
    
    try {
      // Log the call
      const callLog = {
        contact_id: contact.id,
        outcome,
        notes: notes || undefined,
        called_at: new Date().toISOString()
      }
      
      if (navigator.onLine) {
        // If online, save directly
        await ContactService.logCall(callLog)
      } else {
        // If offline, add to sync queue
        await idb.addToSyncQueue({
          type: 'call_log',
          action: 'create',
          data: callLog,
          timestamp: new Date().toISOString()
        })
      }
      
      // Move to next contact
      onNext()
      
      // Reset form
      setOutcome(null)
      setNotes('')
      
      // Notify parent
      onComplete()
    } catch (error) {
      console.error('Error saving call log:', error)
      alert('Failed to save call log')
    } finally {
      setIsSaving(false)
    }
  }

  const outcomeOptions = [
    { value: 'answered' as CallOutcome, label: 'Answered', icon: Check, color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'voicemail' as CallOutcome, label: 'Voicemail', icon: Voicemail, color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'no_answer' as CallOutcome, label: 'No Answer', icon: X, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Contact Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {contact.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{contact.full_name}</h2>
          
          <div className="space-y-1.5 text-sm">
            {contact.last_contact_date && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last contact: <span className="font-medium">{formatDistanceToNow(new Date(contact.last_contact_date))} ago</span></span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Events attended: <span className="font-medium">{contact.total_events_attended}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Call Button */}
      <button
        onClick={() => {
          if (isTelephonyAvailable) {
            setShowCallDialog(true)
          } else {
            // Fallback to native phone call
            window.location.href = `tel:${contact.phone}`
          }
        }}
        className="block w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-600">
                {isTelephonyAvailable ? 'Tap for anonymous call' : 'Tap to call'}
              </p>
              <p className="text-lg font-semibold text-gray-900">{contact.phone}</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Outcome Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What was the outcome?</h3>
        
        <div className="grid grid-cols-3 gap-3">
          {outcomeOptions.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => handleOutcomeSelect(value)}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                outcome === value 
                  ? `${color} scale-105 shadow-sm` 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {outcome === value && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
              <Icon className={`w-6 h-6 mx-auto mb-2 ${outcome === value ? '' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium block ${outcome === value ? '' : 'text-gray-700'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label htmlFor="notes" className="text-lg font-semibold text-gray-900 block mb-3">
          Notes <span className="text-sm font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any details about the conversation..."
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onNext()}
          disabled={isSaving}
          className="flex-1 h-12 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium
                     hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Skip Contact
        </button>
        <button
          onClick={handleSave}
          disabled={!outcome || isSaving}
          className="flex-1 h-12 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-gray-300"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save & Continue'
          )}
        </button>
      </div>

      {/* Call Dialog */}
      <CallDialog
        isOpen={showCallDialog}
        onClose={() => setShowCallDialog(false)}
        contactId={contact.id}
        contactName={contact.full_name}
        contactPhone={contact.phone}
      />
    </div>
  )
}