import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useContactStore } from '@/stores/contactStore'
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  Phone,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'

interface SMSMessage {
  id: string
  contact_id: string
  direction: 'inbound' | 'outbound'
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  phone_number: string
  created_at: string
  metadata?: any
}

interface Conversation {
  contact_id: string
  contact: any
  messages: SMSMessage[]
  last_message_at: string
  unread_count: number
}

export function SMSConversations() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { contacts } = useContactStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('sms_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'communication_logs',
        filter: `type=eq.sms`
      }, handleNewMessage)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    if (!user) return

    try {
      // Get all SMS communications grouped by contact
      const { data: smsLogs, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('type', 'sms')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by contact and create conversations
      const conversationMap = new Map<string, Conversation>()
      
      smsLogs?.forEach(log => {
        if (!log.contact_id) return
        
        const contact = contacts.find(c => c.id === log.contact_id)
        if (!contact) return

        if (!conversationMap.has(log.contact_id)) {
          conversationMap.set(log.contact_id, {
            contact_id: log.contact_id,
            contact,
            messages: [],
            last_message_at: log.created_at,
            unread_count: 0
          })
        }

        const conversation = conversationMap.get(log.contact_id)!
        conversation.messages.push({
          id: log.id,
          contact_id: log.contact_id,
          direction: log.metadata?.direction || 'outbound',
          message: log.content || '',
          status: log.status || 'sent',
          phone_number: contact.phone || '',
          created_at: log.created_at,
          metadata: log.metadata
        })

        // Count unread inbound messages
        if (log.metadata?.direction === 'inbound' && !log.metadata?.read) {
          conversation.unread_count++
        }
      })

      setConversations(Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ))
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (contactId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('contact_id', contactId)
        .eq('type', 'sms')
        .order('created_at', { ascending: true })

      if (error) throw error

      const messages: SMSMessage[] = data.map(log => ({
        id: log.id,
        contact_id: log.contact_id,
        direction: log.metadata?.direction || 'outbound',
        message: log.content || '',
        status: log.status || 'sent',
        phone_number: log.recipient || '',
        created_at: log.created_at,
        metadata: log.metadata
      }))

      setMessages(messages)

      // Mark inbound messages as read
      const unreadIds = data
        .filter(log => log.metadata?.direction === 'inbound' && !log.metadata?.read)
        .map(log => log.id)

      if (unreadIds.length > 0) {
        await supabase
          .from('communication_logs')
          .update({ 
            metadata: supabase.sql`metadata || '{"read": true}'::jsonb`
          })
          .in('id', unreadIds)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleNewMessage = (payload: any) => {
    const newLog = payload.new
    if (newLog.type !== 'sms') return

    // Update conversations list
    loadConversations()

    // If viewing this conversation, add the message
    if (selectedConversation === newLog.contact_id) {
      const newMessage: SMSMessage = {
        id: newLog.id,
        contact_id: newLog.contact_id,
        direction: newLog.metadata?.direction || 'inbound',
        message: newLog.content || '',
        status: newLog.status || 'received',
        phone_number: newLog.recipient || '',
        created_at: newLog.created_at,
        metadata: newLog.metadata
      }
      setMessages(prev => [...prev, newMessage])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    const conversation = conversations.find(c => c.contact_id === selectedConversation)
    if (!conversation || !conversation.contact.phone) return

    setSending(true)
    try {
      // Here you would integrate with your SMS service (Twilio, etc.)
      // For now, we'll just log it to the communication_logs

      const { error } = await supabase
        .from('communication_logs')
        .insert({
          organization_id: user.organization_id,
          contact_id: selectedConversation,
          type: 'sms',
          content: newMessage,
          recipient: conversation.contact.phone,
          status: 'sent',
          metadata: {
            direction: 'outbound',
            sent_by: user.id
          }
        })

      if (error) throw error

      // Clear message input
      setNewMessage('')
      
      // Reload messages
      loadMessages(selectedConversation)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const contact = conv.contact
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.full_name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(searchTerm)
    )
  })

  const selectedContact = conversations.find(c => c.contact_id === selectedConversation)?.contact

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">SMS Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No conversations found
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div
                key={conversation.contact_id}
                onClick={() => setSelectedConversation(conversation.contact_id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.contact_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.contact.full_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.messages[0]?.message}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 ml-2">
                    {format(new Date(conversation.last_message_at), 'MMM d')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <User className="w-8 h-8 p-1.5 bg-gray-200 rounded-full" />
                <div>
                  <p className="font-medium">{selectedContact?.full_name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedContact?.phone}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/contacts/${selectedConversation}`)}
              >
                View Contact
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.direction === 'outbound'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    message.direction === 'outbound' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                    {message.direction === 'outbound' && (
                      <>
                        {message.status === 'delivered' && <CheckCheck className="w-3 h-3 ml-1" />}
                        {message.status === 'sent' && <Check className="w-3 h-3 ml-1" />}
                        {message.status === 'failed' && <AlertCircle className="w-3 h-3 ml-1" />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}