import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { SMSService } from '@/services/sms.service'
import { useCampaignStore } from '@/stores/campaignStore'
import { useContactStore } from '@/stores/contactStore'
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Loader2,
  Image
} from 'lucide-react'

export function SMSCampaign() {
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  const [isSending, setIsSending] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [charCount, setCharCount] = useState(0)
  
  const { campaigns, loadCampaign } = useCampaignStore()
  const { contacts } = useContactStore()
  
  const campaign = campaigns.find(c => c.id === campaignId)
  
  useEffect(() => {
    if (campaignId) {
      loadCampaign(campaignId)
    }
  }, [campaignId, loadCampaign])

  useEffect(() => {
    if (campaign?.sms_body) {
      setMessageBody(campaign.sms_body)
      setCharCount(campaign.sms_body.length)
    }
  }, [campaign])
  
  if (!campaignId || !campaign) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Campaign not found</p>
      </div>
    )
  }

  // Get campaign contacts with valid phone numbers
  const campaignContacts = contacts.filter(contact => 
    contact.phone && campaign.campaign_contacts?.some(cc => cc.contact_id === contact.id)
  )

  const handleMessageChange = (value: string) => {
    setMessageBody(value)
    setCharCount(value.length)
  }

  const getSegmentCount = () => {
    if (charCount <= 160) return 1
    return Math.ceil(charCount / 153) // Multi-part messages use 153 chars per segment
  }

  const handleSendTest = async () => {
    if (!testPhone || !messageBody) {
      alert('Please fill in phone number and message')
      return
    }

    setSendingTest(true)
    try {
      await SMSService.sendSMS({
        to: [testPhone],
        body: `[TEST] ${messageBody}`,
        mediaUrl,
        campaignId: campaign.id,
        tags: ['test', campaign.type]
      })
      alert('Test SMS sent successfully!')
    } catch (error) {
      console.error('Failed to send test SMS:', error)
      alert('Failed to send test SMS')
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!messageBody) {
      alert('Please enter a message')
      return
    }

    if (campaignContacts.length === 0) {
      alert('No contacts with phone numbers selected for this campaign')
      return
    }

    if (!confirm(`Send SMS to ${campaignContacts.length} contacts? This will use ${campaignContacts.length * getSegmentCount()} SMS segments.`)) {
      return
    }

    setIsSending(true)
    try {
      const result = await SMSService.sendCampaignSMS(
        campaign.id,
        campaignContacts.map(c => ({
          id: c.id,
          phone: c.phone!,
          firstName: c.first_name,
          lastName: c.last_name
        })),
        {
          body: messageBody,
          mediaUrl,
          personalizeFields: ['firstName']
        }
      )

      alert(`SMS campaign sent successfully! ${result.successCount} messages sent.`)
      
      // Update campaign
      await useCampaignStore.getState().updateCampaign(campaign.id, {
        sms_body: messageBody,
        status: 'active',
        metadata: {
          ...campaign.metadata,
          last_sms_sent: new Date().toISOString(),
          total_sms_sent: (campaign.metadata?.total_sms_sent || 0) + result.successCount
        }
      })

      navigate(`/campaigns/${campaign.id}/analytics`)
    } catch (error) {
      console.error('Failed to send campaign:', error)
      alert('Failed to send SMS campaign')
    } finally {
      setIsSending(false)
    }
  }

  const stats = campaign.campaign_stats?.[0] || {
    participants: 0,
    conversions: 0,
    shares: 0,
    new_contacts: 0
  }

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Campaign: {campaign.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <p className="text-2xl font-bold">{campaignContacts.length}</p>
              <p className="text-sm text-gray-600">Recipients</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Send className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.participants}</p>
              <p className="text-sm text-gray-600">Sent</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.conversions}</p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Phone className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.shares}</p>
              <p className="text-sm text-gray-600">Responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Hi {{firstName}}, your message here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
            />
            <div className="flex items-center justify-between mt-2 text-sm">
              <p className="text-gray-600">
                Use <code className="bg-gray-100 px-1 rounded">{'{{firstName}}'}</code> to personalize
              </p>
              <p className={`font-medium ${charCount > 160 ? 'text-amber-600' : 'text-gray-600'}`}>
                {charCount} / {getSegmentCount() === 1 ? '160' : `${getSegmentCount() * 153}`} 
                ({getSegmentCount()} {getSegmentCount() === 1 ? 'segment' : 'segments'})
              </p>
            </div>
          </div>

          {/* Media URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media URL (Optional)
            </label>
            <div className="flex gap-2">
              <Image className="w-5 h-5 text-gray-400 mt-2" />
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Attach an image or GIF (additional charges may apply)
            </p>
          </div>

          {/* Preview */}
          {messageBody && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="bg-white rounded-lg p-3 max-w-sm">
                <p className="text-sm whitespace-pre-wrap">
                  {messageBody.replace('{{firstName}}', 'John')}
                </p>
                {mediaUrl && (
                  <div className="mt-2 bg-gray-100 rounded p-2 text-center">
                    <Image className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-xs text-gray-500 mt-1">Media attachment</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Send SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test SMS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Test SMS
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={sendingTest || !testPhone || !messageBody}
              >
                {sendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Test'
                )}
              </Button>
            </div>
          </div>

          {/* Send Campaign */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Ready to Send?</h4>
                <p className="text-sm text-gray-600">
                  This will send to {campaignContacts.length} contacts ({campaignContacts.length * getSegmentCount()} segments)
                </p>
              </div>
              <Button
                onClick={handleSendCampaign}
                disabled={isSending || campaignContacts.length === 0 || !messageBody}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>
          </div>

          {campaign.status === 'scheduled' && campaign.scheduled_for && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4" />
                <p className="text-sm">
                  Scheduled to send on {new Date(campaign.scheduled_for).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}