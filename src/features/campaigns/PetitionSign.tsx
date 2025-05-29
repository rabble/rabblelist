import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PetitionService } from '@/services/petition.service'
import { CampaignService } from '@/features/campaigns/campaigns.service'
import { 
  FileText, 
  Users, 
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  Loader2,
  Share2,
  Twitter,
  Facebook
} from 'lucide-react'

export function PetitionSign() {
  const { id: campaignId } = useParams()
  const [campaign, setCampaign] = useState<any>(null)
  const [_petition, _setPetition] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentSignatures, setRecentSignatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [comment, setComment] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    if (campaignId) {
      loadPetition()
    }
  }, [campaignId])

  useEffect(() => {
    // Auto-refresh signatures every 30 seconds
    const interval = setInterval(() => {
      if (campaignId) {
        loadStats()
        loadRecentSignatures()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [campaignId])

  const loadPetition = async () => {
    if (!campaignId) return
    
    setIsLoading(true)
    try {
      // Load campaign
      const campaignData = await CampaignService.getCampaign(campaignId)
      setCampaign(campaignData)

      // Load petition details
      await PetitionService.getPetition(campaignId)

      // Load stats and signatures
      await Promise.all([
        loadStats(),
        loadRecentSignatures()
      ])
    } catch (error) {
      console.error('Failed to load petition:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!campaignId) return
    const statsData = await PetitionService.getPetitionStats(campaignId)
    setStats(statsData)
  }

  const loadRecentSignatures = async () => {
    if (!campaignId) return
    const { signatures } = await PetitionService.getSignatures(campaignId, {
      limit: 10,
      publicOnly: true
    })
    setRecentSignatures(signatures)
  }

  const validateForm = () => {
    const newErrors: any = {}
    
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      newErrors.zipCode = 'Invalid zip code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !campaignId) return
    
    setIsSigning(true)
    try {
      await PetitionService.signPetition({
        campaignId,
        firstName,
        lastName,
        email,
        phone,
        zipCode,
        comment,
        isPublic
      })

      setShowSuccess(true)
      
      // Reload stats and signatures
      await Promise.all([
        loadStats(),
        loadRecentSignatures()
      ])

      // Clear form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setZipCode('')
      setComment('')
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (error: any) {
      alert(error.message || 'Failed to sign petition')
    } finally {
      setIsSigning(false)
    }
  }

  const shareUrl = window.location.href
  const shareText = `Sign the petition: ${campaign?.title}`

  const handleShare = (platform: string) => {
    const urls: any = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    }
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600">Petition not found</p>
        </div>
      </div>
    )
  }

  const progress = campaign.goal 
    ? Math.round((stats?.totalSignatures / campaign.goal) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{campaign.title}</h1>
          {campaign.description && (
            <p className="text-lg opacity-90">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-600">{stats?.totalSignatures || 0}</p>
              <p className="text-gray-600">Signatures</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {campaign.goal ? `${progress}%` : stats?.recentSignatures || 0}
              </p>
              <p className="text-gray-600">{campaign.goal ? 'of Goal' : 'Today'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats?.topZipCodes[0]?.zipCode || '—'}</p>
              <p className="text-gray-600">Top Zip Code</p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 mx-auto mb-1 text-purple-600" />
              <p className="text-gray-600">Trending</p>
            </div>
          </div>

          {/* Progress Bar */}
          {campaign.goal && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {campaign.goal.toLocaleString()} signatures</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sign Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Sign the Petition</CardTitle>
              </CardHeader>
              <CardContent>
                {showSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Thank you for signing!
                    </h3>
                    <p className="text-green-700 mb-4">
                      Your signature has been recorded. Please share this petition with others.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare('twitter')}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Share on Twitter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare('facebook')}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Share on Facebook
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zip Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.zipCode && (
                          <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        placeholder="Why are you signing this petition?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                        Display my name publicly
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSigning}
                    >
                      {isSigning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        'Sign Petition'
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By signing, you agree to receive email updates about this campaign
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Signatures */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSignatures.map((signature) => (
                    <div key={signature.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {signature.first_name} {signature.last_name.charAt(0)}.
                          </p>
                          {signature.zip_code && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {signature.zip_code}
                            </p>
                          )}
                          {signature.comment && (
                            <p className="text-sm text-gray-700 mt-1 italic">
                              "{signature.comment}"
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(signature.signed_at).toRelativeTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {recentSignatures.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Be the first to sign!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Buttons */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share This Petition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleShare('twitter')}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleShare('facebook')}
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      alert('Link copied to clipboard!')
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}