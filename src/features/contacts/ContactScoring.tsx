import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  TrendingUp,
  Activity,
  Users,
  Zap,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Tag,
  Award,
  Info,
  Settings,
  RefreshCw,
  Save,
  AlertCircle
} from 'lucide-react'
import type { Contact } from '@/types'

interface ScoringRule {
  id: string
  name: string
  description: string
  category: 'activity' | 'recency' | 'frequency' | 'tags' | 'events'
  points: number
  conditions: any
  enabled: boolean
}

interface ContactScore {
  contact_id: string
  total_score: number
  category_scores: {
    activity: number
    recency: number
    frequency: number
    tags: number
    events: number
  }
  level: 'inactive' | 'low' | 'medium' | 'high' | 'champion'
  last_calculated: string
}

const DEFAULT_SCORING_RULES: ScoringRule[] = [
  // Activity Rules
  {
    id: 'call-answered',
    name: 'Answered Phone Call',
    description: 'Contact answered a phone call',
    category: 'activity',
    points: 10,
    conditions: { interaction_type: 'call', status: 'completed' },
    enabled: true
  },
  {
    id: 'email-opened',
    name: 'Opened Email',
    description: 'Contact opened an email',
    category: 'activity',
    points: 3,
    conditions: { interaction_type: 'email', status: 'opened' },
    enabled: true
  },
  {
    id: 'email-clicked',
    name: 'Clicked Email Link',
    description: 'Contact clicked a link in email',
    category: 'activity',
    points: 5,
    conditions: { interaction_type: 'email', status: 'clicked' },
    enabled: true
  },
  {
    id: 'text-responded',
    name: 'Responded to Text',
    description: 'Contact responded to SMS',
    category: 'activity',
    points: 8,
    conditions: { interaction_type: 'text', direction: 'inbound' },
    enabled: true
  },
  {
    id: 'petition-signed',
    name: 'Signed Petition',
    description: 'Contact signed a petition',
    category: 'activity',
    points: 15,
    conditions: { activity_type: 'petition_sign' },
    enabled: true
  },
  {
    id: 'donation-made',
    name: 'Made Donation',
    description: 'Contact made a financial contribution',
    category: 'activity',
    points: 25,
    conditions: { activity_type: 'donation' },
    enabled: true
  },
  
  // Recency Rules
  {
    id: 'contacted-7days',
    name: 'Contacted in Last 7 Days',
    description: 'Any contact within the last week',
    category: 'recency',
    points: 20,
    conditions: { days_since_contact: 7 },
    enabled: true
  },
  {
    id: 'contacted-30days',
    name: 'Contacted in Last 30 Days',
    description: 'Any contact within the last month',
    category: 'recency',
    points: 10,
    conditions: { days_since_contact: 30 },
    enabled: true
  },
  
  // Frequency Rules
  {
    id: 'frequent-engagement',
    name: 'Frequent Engagement',
    description: '5+ interactions in last 90 days',
    category: 'frequency',
    points: 15,
    conditions: { min_interactions_90days: 5 },
    enabled: true
  },
  
  // Tag Rules
  {
    id: 'tag-volunteer',
    name: 'Volunteer Tag',
    description: 'Contact has volunteer tag',
    category: 'tags',
    points: 20,
    conditions: { has_tag: 'volunteer' },
    enabled: true
  },
  {
    id: 'tag-donor',
    name: 'Donor Tag',
    description: 'Contact has donor tag',
    category: 'tags',
    points: 25,
    conditions: { has_tag: 'donor' },
    enabled: true
  },
  {
    id: 'tag-organizer',
    name: 'Organizer Tag',
    description: 'Contact has organizer tag',
    category: 'tags',
    points: 30,
    conditions: { has_tag: 'organizer' },
    enabled: true
  },
  
  // Event Rules
  {
    id: 'event-attended-recent',
    name: 'Recent Event Attendance',
    description: 'Attended event in last 60 days',
    category: 'events',
    points: 20,
    conditions: { event_attended_days: 60 },
    enabled: true
  },
  {
    id: 'event-multiple',
    name: 'Multiple Events',
    description: 'Attended 3+ events total',
    category: 'events',
    points: 25,
    conditions: { min_events_attended: 3 },
    enabled: true
  }
]

export function ContactScoring() {
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [stats, setStats] = useState({
    totalContacts: 0,
    scoredContacts: 0,
    avgScore: 0,
    distribution: {
      inactive: 0,
      low: 0,
      medium: 0,
      high: 0,
      champion: 0
    }
  })

  useEffect(() => {
    loadScoringRules()
    loadScoringStats()
  }, [])

  const loadScoringRules = async () => {
    setIsLoading(true)
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Load saved rules from organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const savedRules = (org?.settings as any)?.scoring_rules || DEFAULT_SCORING_RULES
      setScoringRules(savedRules)
    } catch (error) {
      console.error('Error loading scoring rules:', error)
      setScoringRules(DEFAULT_SCORING_RULES)
    } finally {
      setIsLoading(false)
    }
  }

  const loadScoringStats = async () => {
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) return

      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      // Get scoring distribution from custom_fields
      const { data: contacts } = await supabase
        .from('contacts')
        .select('custom_fields')
        .eq('organization_id', orgId)

      let scoredContacts = 0
      let totalScore = 0
      const distribution = {
        inactive: 0,
        low: 0,
        medium: 0,
        high: 0,
        champion: 0
      }

      contacts?.forEach(contact => {
        const score = (contact.custom_fields as any)?.engagement_score
        if (score !== undefined) {
          scoredContacts++
          totalScore += score.total_score || 0
          const level = score.level || getScoreLevel(score.total_score)
          distribution[level as keyof typeof distribution]++
        }
      })

      setStats({
        totalContacts: totalContacts || 0,
        scoredContacts,
        avgScore: scoredContacts > 0 ? Math.round(totalScore / scoredContacts) : 0,
        distribution
      })
    } catch (error) {
      console.error('Error loading scoring stats:', error)
    }
  }

  const getScoreLevel = (score: number): ContactScore['level'] => {
    if (score === 0) return 'inactive'
    if (score < 25) return 'low'
    if (score < 50) return 'medium'
    if (score < 100) return 'high'
    return 'champion'
  }

  const saveRules = async () => {
    setIsSaving(true)
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get current organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const currentSettings = org?.settings as any || {}

      // Update with new scoring rules
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...currentSettings,
            scoring_rules: scoringRules
          }
        })
        .eq('id', orgId)

      if (error) throw error
    } catch (error) {
      console.error('Error saving scoring rules:', error)
      alert('Failed to save scoring rules')
    } finally {
      setIsSaving(false)
    }
  }

  const recalculateAllScores = async () => {
    if (!confirm('Recalculate engagement scores for all contacts? This may take a while.')) return

    setIsRecalculating(true)
    try {
      const { data: orgId } = await supabase.rpc('organization_id')
      if (!orgId) throw new Error('No organization found')

      // Get all contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)

      if (!contacts) return

      // Process in batches
      const batchSize = 50
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (contact) => {
          const score = await calculateContactScore(contact, scoringRules)
          
          // Update contact with new score
          await supabase
            .from('contacts')
            .update({
              custom_fields: {
                ...(contact.custom_fields as any || {}),
                engagement_score: score
              }
            })
            .eq('id', contact.id)
        }))
      }

      await loadScoringStats()
    } catch (error) {
      console.error('Error recalculating scores:', error)
      alert('Failed to recalculate scores')
    } finally {
      setIsRecalculating(false)
    }
  }

  const calculateContactScore = async (contact: Contact, rules: ScoringRule[]): Promise<ContactScore> => {
    const categoryScores = {
      activity: 0,
      recency: 0,
      frequency: 0,
      tags: 0,
      events: 0
    }

    // Get contact interactions for activity scoring
    const { data: interactions } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    // Get campaign activities
    const { data: campaignActivities } = await supabase
      .from('campaign_activities')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    // Apply rules
    for (const rule of rules.filter(r => r.enabled)) {
      let points = 0

      switch (rule.category) {
        case 'activity':
          // Check interactions
          if (rule.conditions.interaction_type && rule.conditions.status) {
            points = interactions?.filter(i => 
              i.type === rule.conditions.interaction_type &&
              i.status === rule.conditions.status
            ).length || 0
          } else if (rule.conditions.interaction_type && rule.conditions.direction) {
            points = interactions?.filter(i => 
              i.type === rule.conditions.interaction_type &&
              i.direction === rule.conditions.direction
            ).length || 0
          } else if (rule.conditions.activity_type) {
            points = campaignActivities?.filter(a => 
              a.activity_type === rule.conditions.activity_type
            ).length || 0
          }
          categoryScores.activity += points * rule.points
          break

        case 'recency':
          if (contact.last_contact_date) {
            const daysSince = Math.floor(
              (Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
            )
            if (daysSince <= rule.conditions.days_since_contact) {
              categoryScores.recency += rule.points
            }
          }
          break

        case 'frequency':
          if (rule.conditions.min_interactions_90days) {
            const count = (interactions?.length || 0) + (campaignActivities?.length || 0)
            if (count >= rule.conditions.min_interactions_90days) {
              categoryScores.frequency += rule.points
            }
          }
          break

        case 'tags':
          if (rule.conditions.has_tag && contact.tags.includes(rule.conditions.has_tag)) {
            categoryScores.tags += rule.points
          }
          break

        case 'events':
          if (rule.conditions.min_events_attended && 
              contact.total_events_attended >= rule.conditions.min_events_attended) {
            categoryScores.events += rule.points
          }
          // TODO: Check recent event attendance when event_registrations are accessible
          break
      }
    }

    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0)

    return {
      contact_id: contact.id,
      total_score: totalScore,
      category_scores: categoryScores,
      level: getScoreLevel(totalScore),
      last_calculated: new Date().toISOString()
    }
  }

  const updateRuleEnabled = (ruleId: string, enabled: boolean) => {
    setScoringRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      )
    )
  }

  const updateRulePoints = (ruleId: string, points: number) => {
    setScoringRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, points } : rule
      )
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Contact Engagement Scoring
            </h1>
            <p className="text-gray-600 mt-1">
              Configure how contacts are scored based on their engagement
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={recalculateAllScores}
              disabled={isRecalculating}
            >
              {isRecalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculate All
                </>
              )}
            </Button>
            <Button
              onClick={saveRules}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Rules
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.totalContacts}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scored</p>
                <p className="text-2xl font-bold">{stats.scoredContacts}</p>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{stats.avgScore}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Champions</p>
                <p className="text-2xl font-bold">{stats.distribution.champion}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Engaged</p>
                <p className="text-2xl font-bold">{stats.distribution.high}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.distribution).map(([level, count]) => {
              const percentage = stats.totalContacts > 0 
                ? Math.round((count / stats.totalContacts) * 100)
                : 0
              const colors = {
                inactive: 'bg-gray-500',
                low: 'bg-orange-500',
                medium: 'bg-blue-500',
                high: 'bg-green-500',
                champion: 'bg-purple-500'
              }
              
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{level}</span>
                    <span className="text-sm text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[level as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scoring Rules</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Toggle rules on/off and adjust point values</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {['activity', 'recency', 'frequency', 'tags', 'events'].map(category => {
                const categoryRules = scoringRules.filter(r => r.category === category)
                const categoryIcons = {
                  activity: Activity,
                  recency: Clock,
                  frequency: TrendingUp,
                  tags: Tag,
                  events: Calendar
                }
                const Icon = categoryIcons[category as keyof typeof categoryIcons]

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <h3 className="font-medium text-gray-900 capitalize">
                        {category} Rules
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {categoryRules.map(rule => (
                        <div
                          key={rule.id}
                          className={`p-4 border rounded-lg ${
                            rule.enabled ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) => updateRuleEnabled(rule.id, e.target.checked)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <h4 className={`font-medium ${
                                  rule.enabled ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {rule.name}
                                </h4>
                                <p className={`text-sm mt-1 ${
                                  rule.enabled ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                  {rule.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={rule.points}
                                onChange={(e) => updateRulePoints(rule.id, parseInt(e.target.value) || 0)}
                                disabled={!rule.enabled}
                                className="w-20 px-3 py-1 text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                              <span className="text-sm text-gray-600">pts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">How Engagement Scoring Works</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Scores are calculated based on contact activities, recency, frequency, tags, and event attendance</li>
                <li>Higher scores indicate more engaged contacts who are likely to take action</li>
                <li>Scores are stored in the contact's custom fields and can be used for segmentation</li>
                <li>Use smart lists to create segments based on score levels</li>
                <li>Recalculate scores periodically to keep them current</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}