import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PhoneBankService } from '@/services/phonebank.service'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuth } from '@/features/auth/AuthContext'
import type { Campaign, CampaignStats } from '@/types/campaign.types'
import { 
  Phone, 
  Users, 
  AlertCircle,
  Play,
  Pause,
  PhoneOff,
  User,
  MessageSquare,
  BarChart3,
  Loader2,
  PhoneCall
} from 'lucide-react'

interface CallOutcome {
  value: string
  label: string
  color: string
}

const CALL_OUTCOMES: CallOutcome[] = [
  { value: 'supporter', label: 'Supporter', color: 'bg-green-500' },
  { value: 'undecided', label: 'Undecided', color: 'bg-yellow-500' },
  { value: 'opposed', label: 'Opposed', color: 'bg-red-500' },
  { value: 'wrong_number', label: 'Wrong Number', color: 'bg-gray-500' },
  { value: 'do_not_call', label: 'Do Not Call', color: 'bg-purple-500' },
  { value: 'callback', label: 'Callback Later', color: 'bg-blue-500' }
]

export function PhoneBankCampaign() {
  const { id: campaignId } = useParams()
  const { profile: user } = useAuth()
  const { campaigns, loadCampaign } = useCampaignStore()
  
  const [session, setSession] = useState<any>(null)
  const [currentContact, setCurrentContact] = useState<any>(null)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState<string>('')
  const [callDuration, setCallDuration] = useState(0)
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null)
  const [callNotes, setCallNotes] = useState('')
  const [selectedOutcome, setSelectedOutcome] = useState<string>('')
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [script, setScript] = useState<any>(null)
  
  const campaign = campaigns.find(c => c.id === campaignId)
  
  // Helper function to get campaign stat value
  const getCampaignStat = (campaign: Campaign, statType: string): number => {
    if (!campaign.campaign_stats || !Array.isArray(campaign.campaign_stats)) return 0
    const stat = campaign.campaign_stats.find((s: CampaignStats) => s.stat_type === statType)
    return stat?.stat_value || 0
  }
  
  useEffect(() => {
    if (campaignId) {
      loadCampaign(campaignId)
      loadScript()
    }
  }, [campaignId])

  useEffect(() => {
    if (user?.id) {
      checkActiveSession()
    }
  }, [user])

  useEffect(() => {
    if (session?.id) {
      loadSessionStats()
      const interval = setInterval(loadSessionStats, 30000) // Update every 30s
      return () => clearInterval(interval)
    }
  }, [session])

  const checkActiveSession = async () => {
    if (!user?.id) return
    const activeSession = await PhoneBankService.getActiveSession(user.id)
    if (activeSession && activeSession.campaignId === campaignId) {
      setSession(activeSession)
      loadNextContact()
    }
  }

  const loadScript = async () => {
    if (!campaignId) return
    const scriptData = await PhoneBankService.getScript(campaignId)
    setScript(scriptData)
  }

  const loadSessionStats = async () => {
    if (!session?.id) return
    const stats = await PhoneBankService.getSessionStats(session.id)
    setSessionStats(stats)
  }

  const loadNextContact = async () => {
    if (!campaignId || !session?.id) return
    const contact = await PhoneBankService.getNextContact(campaignId, session.id)
    setCurrentContact(contact)
    setCallNotes('')
    setSelectedOutcome('')
  }

  const handleStartSession = async () => {
    if (!campaignId || !user?.id) return
    
    setIsStarting(true)
    try {
      const newSession = await PhoneBankService.startSession(campaignId, user.id)
      setSession(newSession)
      await loadNextContact()
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start phone banking session')
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndSession = async () => {
    if (!session?.id) return
    
    if (!confirm('Are you sure you want to end this phone banking session?')) return
    
    try {
      await PhoneBankService.endSession(session.id)
      setSession(null)
      setCurrentContact(null)
      setCurrentCall(null)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const handleStartCall = async () => {
    if (!session?.id || !currentContact?.id || !currentContact?.phone) return
    
    setIsCalling(true)
    setCallStatus('Connecting...')
    try {
      const callId = await PhoneBankService.startCall(
        session.id,
        currentContact.id,
        currentContact.phone
      )
      setCurrentCall({ id: callId, startTime: Date.now() })
      setCallStatus('Connected')
      
      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      setCallTimer(timer)
    } catch (error: any) {
      console.error('Failed to start call:', error)
      setCallStatus('')
      alert(error.message || 'Failed to start call. Please check your connection and try again.')
    } finally {
      setIsCalling(false)
    }
  }

  const handleEndCall = async () => {
    if (!currentCall?.id) return
    
    // Clear timer
    if (callTimer) {
      clearInterval(callTimer)
      setCallTimer(null)
    }
    
    const duration = callDuration
    await PhoneBankService.updateCallStatus(currentCall.id, 'completed', duration)
    
    // Save outcome and notes if provided
    if (selectedOutcome) {
      await PhoneBankService.saveCallOutcome(
        currentCall.id,
        selectedOutcome as any,
        callNotes
      )
    }
    
    setCurrentCall(null)
    setCallStatus('')
    setCallDuration(0)
    await loadSessionStats()
    await loadNextContact()
  }

  const handleNoAnswer = async () => {
    if (!currentCall?.id) return
    
    // Clear timer
    if (callTimer) {
      clearInterval(callTimer)
      setCallTimer(null)
    }
    
    await PhoneBankService.updateCallStatus(currentCall.id, 'no_answer')
    setCurrentCall(null)
    setCallStatus('')
    setCallDuration(0)
    await loadSessionStats()
    await loadNextContact()
  }

  if (!campaignId || !campaign) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Campaign not found</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Phone Bank: {campaign.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <PhoneCall className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Ready to Make Calls?</h3>
            <p className="text-gray-600 mb-6">
              Start a phone banking session to begin calling supporters
            </p>
            <Button
              size="lg"
              onClick={handleStartSession}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Session...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Phone Banking
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Calling Interface */}
      <div className="lg:col-span-2 space-y-6">
        {/* Current Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Contact</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndSession}
              >
                <Pause className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentContact ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{currentContact.full_name}</h3>
                    <p className="text-gray-600">{currentContact.phone}</p>
                  </div>
                </div>
                
                {/* Call Status */}
                {callStatus && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="text-sm font-medium text-blue-900">{callStatus}</span>
                    </div>
                    {currentCall && (
                      <span className="text-sm font-mono text-blue-700">
                        {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )}

                {/* Call Controls */}
                <div className="flex gap-3">
                  {!currentCall ? (
                    <Button
                      className="flex-1"
                      onClick={handleStartCall}
                      disabled={isCalling}
                    >
                      {isCalling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4 mr-2" />
                          Start Call
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleEndCall}
                      >
                        <PhoneOff className="w-4 h-4 mr-2" />
                        End Call
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleNoAnswer}
                      >
                        No Answer
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={loadNextContact}
                    disabled={!!currentCall}
                  >
                    Skip
                  </Button>
                </div>

                {/* Tags */}
                {currentContact.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentContact.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No more contacts to call</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Script */}
        {script && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Call Script
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">
                  {script.content
                    .replace('[Name]', currentContact?.full_name || 'there')
                    .replace('[Your Name]', user?.full_name || 'a volunteer')
                    .replace('[Organization]', 'Rise Community Action')
                    .replace('[Campaign Topic]', campaign.title)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Outcome */}
        {currentCall && (
          <Card>
            <CardHeader>
              <CardTitle>Call Outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did the call go?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CALL_OUTCOMES.map(outcome => (
                    <button
                      key={outcome.value}
                      onClick={() => setSelectedOutcome(outcome.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedOutcome === outcome.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${outcome.color} mx-auto mb-2`} />
                      <p className="text-sm font-medium">{outcome.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Add any notes about the call..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="space-y-6">
        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionStats ? (
              <div className="space-y-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{sessionStats.totalCalls}</p>
                  <p className="text-sm text-gray-600">Total Calls</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-700">{sessionStats.supporters}</p>
                    <p className="text-xs text-gray-600">Supporters</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-yellow-700">{sessionStats.undecided}</p>
                    <p className="text-xs text-gray-600">Undecided</p>
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold">{Math.floor(sessionStats.avgDuration / 60)}:{(sessionStats.avgDuration % 60).toString().padStart(2, '0')}</p>
                  <p className="text-sm text-gray-600">Avg Call Time</p>
                </div>
              </div>
            ) : (
              <LoadingSpinner />
            )}
          </CardContent>
        </Card>

        {/* Campaign Goal */}
        {campaign.goal && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {getCampaignStat(campaign, 'participants')} / {campaign.goal}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (getCampaignStat(campaign, 'participants') / campaign.goal) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}