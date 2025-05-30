import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { 
  ArrowLeft,
  Users,
  Target,
  Clock,
  Crown,
  BarChart3,
  RefreshCw,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Settings
} from 'lucide-react'
import { ABTestingService, type ABTestStatus, type ABTestConfig } from '@/services/abTesting.service'
import { supabase } from '@/lib/supabase'

interface VariantPerformance {
  variant_id: string
  variant_name: string
  sample_size: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  is_winner: boolean
  confidence_score?: number
}

export function ABTestingDashboard() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const abTestService = ABTestingService.getInstance()
  
  const [status, setStatus] = useState<ABTestStatus | null>(null)
  const [config, setConfig] = useState<ABTestConfig | null>(null)
  const [performance, setPerformance] = useState<VariantPerformance[]>([])
  const [campaign, setCampaign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    if (campaignId) {
      loadTestData()
    }
  }, [campaignId])

  const loadTestData = async () => {
    setIsLoading(true)
    try {
      // Get campaign details
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      setCampaign(campaignData)

      // Get A/B test configuration
      const testConfig = await abTestService.getABTestConfig(campaignId!)
      setConfig(testConfig)

      if (testConfig) {
        // Get test status and results
        const testStatus = await abTestService.getTestStatus(campaignId!)
        setStatus(testStatus)

        // Process variant performance
        if (testStatus?.results) {
          const variantMap = new Map<string, VariantPerformance>()
          
          // Initialize variants
          testConfig.variants.forEach(variant => {
            variantMap.set(variant.id, {
              variant_id: variant.id,
              variant_name: variant.name,
              sample_size: 0,
              open_rate: 0,
              click_rate: 0,
              conversion_rate: 0,
              is_winner: false
            })
          })
          
          // Fill in results
          testStatus.results.forEach(result => {
            const variant = variantMap.get(result.variant_id)
            if (variant) {
              variant.sample_size = result.sample_size
              variant.is_winner = result.is_winner
              variant.confidence_score = result.confidence_score
              
              switch (result.metric_name) {
                case 'open_rate':
                  variant.open_rate = result.metric_value
                  break
                case 'click_rate':
                  variant.click_rate = result.metric_value
                  break
                case 'conversion_rate':
                  variant.conversion_rate = result.metric_value
                  break
              }
            }
          })
          
          setPerformance(Array.from(variantMap.values()))
        }
      }
    } catch (error) {
      console.error('Error loading A/B test data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculateResults = async () => {
    if (!campaignId) return
    
    setIsCalculating(true)
    try {
      await abTestService.calculateResults(campaignId)
      await loadTestData()
    } catch (error) {
      console.error('Error calculating results:', error)
      alert('Failed to calculate results')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleEndTest = async (winningVariantId?: string) => {
    if (!campaignId) return
    
    const confirmMessage = winningVariantId 
      ? `End test and declare "${performance.find(p => p.variant_id === winningVariantId)?.variant_name}" as the winner?`
      : 'End test without declaring a winner?'
    
    if (!confirm(confirmMessage)) return
    
    try {
      await abTestService.endTest(campaignId, winningVariantId)
      await loadTestData()
    } catch (error) {
      console.error('Error ending test:', error)
      alert('Failed to end test')
    }
  }

  const getWinningCriteriaLabel = (criteria: string) => {
    switch (criteria) {
      case 'open_rate': return 'Open Rate'
      case 'click_rate': return 'Click Rate'
      case 'conversion_rate': return 'Conversion Rate'
      default: return criteria
    }
  }

  // const getVariantValue = (variant: VariantPerformance, criteria: string) => {
  //   switch (criteria) {
  //     case 'open_rate': return variant.open_rate
  //     case 'click_rate': return variant.click_rate
  //     case 'conversion_rate': return variant.conversion_rate
  //     default: return 0
  //   }
  // }

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.floor(hours * 60)}m`
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = Math.floor(hours % 24)
      return `${days}d ${remainingHours}h`
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!config || !status) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaign
        </Button>
        
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No A/B Test Configured
            </h3>
            <p className="text-gray-600 mb-4">
              This campaign is not set up for A/B testing.
            </p>
            <Button onClick={() => navigate(`/campaigns/${campaignId}/ab-test/setup`)}>
              <Settings className="w-4 h-4 mr-2" />
              Set Up A/B Test
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaign
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              A/B Test Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {campaign?.name} - {getWinningCriteriaLabel(config.winning_criteria)} Optimization
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCalculateResults}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              Calculate Results
            </Button>
            
            {status.is_running && (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => handleEndTest()}
              >
                <Square className="w-4 h-4 mr-2" />
                End Test
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Test Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {status.is_running ? (
                    <>
                      <Play className="w-4 h-4 text-green-500" />
                      Running
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-gray-500" />
                      Ended
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-2xl font-bold">{status.total_participants}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {status.is_running ? 'Time Remaining' : 'Duration'}
                </p>
                <p className="text-2xl font-bold">
                  {status.is_running 
                    ? formatTime(status.time_remaining_hours || 0)
                    : formatTime(config.test_duration_hours)
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Winner</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {status.has_winner ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Declared
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 text-gray-400" />
                      Pending
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performance.map((variant) => (
              <div key={variant.variant_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{variant.variant_name}</h3>
                    {variant.is_winner && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <Trophy className="w-3 h-3" />
                        Winner
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Sample Size</p>
                    <p className="text-xl font-bold">{variant.sample_size}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Open Rate</p>
                    <p className={`text-xl font-bold ${
                      config.winning_criteria === 'open_rate' && variant.is_winner
                        ? 'text-yellow-600'
                        : 'text-gray-900'
                    }`}>
                      {variant.open_rate.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Click Rate</p>
                    <p className={`text-xl font-bold ${
                      config.winning_criteria === 'click_rate' && variant.is_winner
                        ? 'text-yellow-600'
                        : 'text-gray-900'
                    }`}>
                      {variant.click_rate.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className={`text-xl font-bold ${
                      config.winning_criteria === 'conversion_rate' && variant.is_winner
                        ? 'text-yellow-600'
                        : 'text-gray-900'
                    }`}>
                      {variant.conversion_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {variant.confidence_score && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Statistical Confidence</span>
                      <div className="flex items-center gap-2">
                        {variant.confidence_score >= 0.95 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : variant.confidence_score >= 0.90 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {(variant.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {status.is_running && variant.sample_size >= config.minimum_sample_size / config.variants.length && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEndTest(variant.variant_id)}
                      className="w-full"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Declare Winner
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Winning Criteria</p>
              <p className="font-medium">{getWinningCriteriaLabel(config.winning_criteria)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Test Duration</p>
              <p className="font-medium">{config.test_duration_hours} hours</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Min Sample Size</p>
              <p className="font-medium">{config.minimum_sample_size}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Confidence Level</p>
              <p className="font-medium">{(config.confidence_level * 100).toFixed(0)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}