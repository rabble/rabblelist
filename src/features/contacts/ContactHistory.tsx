import { useState, useEffect } from 'react'
import { ContactService } from './contacts.service'
import { AnalyticsService } from '@/services/analytics.service'
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  StickyNote, 
  Tag, 
  X,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  DollarSign,
  PhoneOutgoing,
  PhoneIncoming,
  Megaphone,
  HandHeart,
  MapPin
} from 'lucide-react'

// Define types based on the database schema
type ContactInteraction = {
  id: string
  contact_id: string
  organization_id: string
  user_id?: string | null
  type: 'call' | 'text' | 'email' | 'event' | 'note' | 'tag_added' | 'tag_removed'
  direction?: 'inbound' | 'outbound' | null
  status?: 'completed' | 'missed' | 'busy' | 'no_answer' | 'voicemail' | 'scheduled' | 'cancelled' | null
  duration?: number | null
  outcome?: string | null
  notes?: string | null
  metadata?: any
  created_at: string
  user?: {
    full_name: string | null
    email: string | null
  } | null
}

type CampaignActivity = {
  id: string
  campaign_id: string
  contact_id?: string | null
  organization_id: string
  user_id?: string | null
  activity_type: string
  details?: any
  outcome?: string | null
  notes?: string | null
  created_at: string
  campaigns?: {
    name: string
    type: string
  }
}

type EventRegistration = {
  id: string
  event_id: string
  contact_id?: string | null
  status: string
  created_at: string
  registered_at: string
  events?: {
    name: string
    date: string
    location?: string | null
  }
}

type CallLog = {
  id: string
  contact_id: string
  outcome: string
  duration_seconds?: number | null
  notes?: string | null
  called_at: string
}

interface ContactHistoryProps {
  contactId: string
}

interface TimelineItem {
  id: string
  type: 'interaction' | 'campaign' | 'event' | 'call' | 'donation' | 'petition'
  icon: React.ElementType
  iconColor: string
  title: string
  description?: string
  user?: string
  timestamp: string
  metadata?: any
}

export function ContactHistory({ contactId }: ContactHistoryProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])

  useEffect(() => {
    loadAllActivities()
  }, [contactId])

  const loadAllActivities = async () => {
    setIsLoading(true)
    try {
      // Load all different types of activities in parallel
      const [
        interactionsData,
        campaignData,
        eventsData,
        callsData
      ] = await Promise.all([
        ContactService.getContactInteractions(contactId),
        AnalyticsService.getCampaignActivitiesByContact(contactId),
        AnalyticsService.getEventRegistrationsByContact(contactId),
        ContactService.getCallHistory(contactId)
      ])


      // Combine all activities into a single timeline
      const combined = combineActivities(
        interactionsData.data || [],
        campaignData || [],
        eventsData || [],
        callsData.data || []
      )
      setTimelineItems(combined)
    } catch (error) {
      console.error('Error loading contact history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const combineActivities = (
    interactions: ContactInteraction[],
    campaigns: CampaignActivity[],
    events: EventRegistration[],
    calls: CallLog[]
  ): TimelineItem[] => {
    const items: TimelineItem[] = []

    // Add interactions
    interactions.forEach(interaction => {
      items.push({
        id: interaction.id,
        type: 'interaction',
        icon: getInteractionIcon(interaction.type),
        iconColor: getInteractionColor(interaction),
        title: getInteractionTitle(interaction),
        description: interaction.notes || undefined,
        user: interaction.user?.full_name || 'System',
        timestamp: interaction.created_at,
        metadata: interaction.metadata
      })
    })

    // Add campaign activities
    campaigns.forEach(activity => {
      items.push({
        id: activity.id,
        type: 'campaign',
        icon: getCampaignIcon(activity.activity_type),
        iconColor: 'text-purple-600',
        title: getCampaignTitle(activity),
        description: activity.notes || undefined,
        user: 'Campaign',
        timestamp: activity.created_at,
        metadata: activity.details
      })
    })

    // Add event registrations
    events.forEach(event => {
      items.push({
        id: event.id,
        type: 'event',
        icon: Calendar,
        iconColor: 'text-green-600',
        title: 'Event Registration',
        description: `Registered for event`,
        timestamp: event.created_at,
        metadata: { status: event.status }
      })
    })

    // Add call logs (if not already in interactions)
    calls.forEach(call => {
      // Check if this call is already in interactions
      const isDuplicate = interactions.some(i => 
        i.type === 'call' && 
        Math.abs(new Date(i.created_at).getTime() - new Date(call.called_at).getTime()) < 60000
      )
      
      if (!isDuplicate) {
        items.push({
          id: call.id,
          type: 'call',
          icon: Phone,
          iconColor: call.outcome === 'answered' ? 'text-green-600' : 'text-red-600',
          title: `Call - ${call.outcome.replace('_', ' ')}`,
          description: call.notes || undefined,
          user: 'Phone Bank',
          timestamp: call.called_at,
          metadata: { duration: call.duration_seconds }
        })
      }
    })

    // Sort by timestamp (newest first)
    return items.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone
      case 'text': return MessageSquare
      case 'email': return Mail
      case 'event': return Calendar
      case 'note': return StickyNote
      case 'tag_added':
      case 'tag_removed': return Tag
      default: return StickyNote
    }
  }

  const getInteractionColor = (interaction: ContactInteraction) => {
    if (interaction.type === 'call') {
      if (interaction.direction === 'inbound') return 'text-blue-600'
      if (interaction.status === 'completed') return 'text-green-600'
      return 'text-red-600'
    }
    
    switch (interaction.type) {
      case 'text': return 'text-purple-600'
      case 'email': return 'text-indigo-600'
      case 'event': return 'text-green-600'
      case 'tag_added': return 'text-yellow-600'
      case 'tag_removed': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getInteractionTitle = (interaction: ContactInteraction) => {
    const directionIcon = interaction.direction === 'inbound' ? 
      <ArrowDownLeft className="w-3 h-3 inline" /> : 
      <ArrowUpRight className="w-3 h-3 inline" />

    switch (interaction.type) {
      case 'call':
        return (
          <>
            {directionIcon} Call {interaction.status && `- ${interaction.status.replace('_', ' ')}`}
          </>
        )
      case 'text':
        return (
          <>
            {directionIcon} Text Message
          </>
        )
      case 'email':
        return (
          <>
            {directionIcon} Email
          </>
        )
      case 'event':
        return 'Event Attendance'
      case 'note':
        return 'Note Added'
      case 'tag_added':
        return `Tag Added: ${interaction.metadata?.tag || 'Unknown'}`
      case 'tag_removed':
        return `Tag Removed: ${interaction.metadata?.tag || 'Unknown'}`
      default:
        return interaction.type
    }
  }

  const getCampaignIcon = (activityType: string) => {
    if (activityType.includes('petition')) return FileText
    if (activityType.includes('donation')) return DollarSign
    if (activityType.includes('phone')) return Phone
    if (activityType.includes('canvas')) return MapPin
    if (activityType.includes('volunteer')) return HandHeart
    return Megaphone
  }

  const getCampaignTitle = (activity: CampaignActivity) => {
    if (activity.outcome) {
      return `Campaign: ${activity.activity_type} - ${activity.outcome}`
    }
    return `Campaign: ${activity.activity_type}`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return `${diffMins} minutes ago`
      }
      return `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No activity history yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Interactions will appear here as they happen
        </p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {timelineItems.map((item, idx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {idx !== timelineItems.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.iconColor} bg-opacity-10`}>
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    )}
                    {item.metadata?.duration && (
                      <p className="mt-1 text-xs text-gray-500">
                        Duration: {Math.floor(item.metadata.duration / 60)}:
                        {(item.metadata.duration % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <p>{formatTimestamp(item.timestamp)}</p>
                    {item.user && (
                      <p className="text-xs mt-1">{item.user}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}