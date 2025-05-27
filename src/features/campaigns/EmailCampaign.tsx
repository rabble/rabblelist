import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmailService } from '@/services/email.service'
import { useCampaignStore } from '@/stores/campaignStore'
import { useContactStore } from '@/stores/contactStore'
import { 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react'

export function EmailCampaign() {
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  const [isSending, setIsSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  
  const { campaigns } = useCampaignStore()
  const { contacts } = useContactStore()
  
  const campaign = campaigns.find(c => c.id === campaignId)
  
  useEffect(() => {
    if (campaignId) {
      useCampaignStore.getState().loadCampaign(campaignId)
    }
  }, [campaignId])
  
  if (!campaignId || !campaign) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Campaign not found</p>
      </div>
    )
  }

  // Get campaign contacts
  const campaignContacts = contacts.filter(contact => 
    campaign.campaign_contacts?.some(cc => cc.contact_id === contact.id)
  )

  const handleSendTest = async () => {
    if (!testEmail || !campaign.email_subject || !campaign.email_body) {
      alert('Please fill in all email fields and test email address')
      return
    }

    setSendingTest(true)
    try {
      await EmailService.sendEmail({
        to: [testEmail],
        subject: `[TEST] ${campaign.email_subject}`,
        html: campaign.email_body,
        campaignId: campaign.id,
        tags: ['test', campaign.type]
      })
      alert('Test email sent successfully!')
    } catch (error) {
      console.error('Failed to send test email:', error)
      alert('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!campaign.email_subject || !campaign.email_body) {
      alert('Please fill in email subject and body')
      return
    }

    if (campaignContacts.length === 0) {
      alert('No contacts selected for this campaign')
      return
    }

    const validContacts = campaignContacts.filter(c => c.email)
    if (validContacts.length === 0) {
      alert('No contacts with valid email addresses')
      return
    }

    if (!confirm(`Send email to ${validContacts.length} contacts?`)) {
      return
    }

    setIsSending(true)
    try {
      const result = await EmailService.sendCampaignEmail(
        campaign.id,
        validContacts.map(c => ({
          id: c.id,
          email: c.email!,
          firstName: c.first_name,
          lastName: c.last_name
        })),
        {
          subject: campaign.email_subject,
          html: campaign.email_body,
          tags: [campaign.type, 'campaign']
        }
      )

      alert(`Email campaign sent successfully! ${result.successCount} emails sent.`)
      
      // Update campaign status
      await useCampaignStore.getState().updateCampaign(campaign.id, {
        status: 'active',
        metadata: {
          ...campaign.metadata,
          last_email_sent: new Date().toISOString(),
          total_emails_sent: (campaign.metadata?.total_emails_sent || 0) + result.successCount
        }
      })

      navigate(`/campaigns/${campaign.id}/analytics`)
    } catch (error) {
      console.error('Failed to send campaign:', error)
      alert('Failed to send email campaign')
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
            <Mail className="w-5 h-5" />
            Email Campaign: {campaign.title}
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
              <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.conversions}</p>
              <p className="text-sm text-gray-600">Opens</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.shares}</p>
              <p className="text-sm text-gray-600">Clicks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.email_subject && campaign.email_body ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="border-b pb-4 mb-4">
                <p className="text-sm text-gray-600">Subject:</p>
                <p className="font-medium">{campaign.email_subject}</p>
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.email_body }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No email content yet</p>
              <Button 
                className="mt-4"
                onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
              >
                Edit Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Send Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={sendingTest || !testEmail || !campaign.email_subject}
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
                  This will send the email to {campaignContacts.filter(c => c.email).length} contacts
                </p>
              </div>
              <Button
                onClick={handleSendCampaign}
                disabled={isSending || campaignContacts.length === 0 || !campaign.email_subject}
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