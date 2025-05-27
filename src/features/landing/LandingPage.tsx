import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { 
  Users, 
  Calendar, 
  Phone, 
  Tag, 
  Search, 
  BarChart3,
  CheckCircle,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

  const features = [
    {
      title: 'Dashboard Overview',
      description: 'Get instant insights with stats, recent activities, and quick actions',
      screenshot: '/screenshot-dashboard.png',
      alt: 'Dashboard showing welcome screen with stats and quick actions'
    },
    {
      title: 'Contact Management',
      description: 'Organize contacts with tags, search, and advanced filters',
      screenshot: '/screenshot-contacts.png',
      alt: 'Contacts list with tags, search functionality, and filters'
    },
    {
      title: 'Detailed Contact View',
      description: 'Track call history, notes, and engagement for each contact',
      screenshot: '/screenshot-contact-detail.png',
      alt: 'Individual contact view with call history and action buttons'
    },
    {
      title: 'Event Management',
      description: 'Create and manage events, track attendance, and follow up',
      screenshot: '/screenshot-event.png',
      alt: 'Event creation form with details and management options'
    }
  ]

  const benefits = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Building',
      description: 'Connect with activists and organizers to build powerful movements together'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Direct Action',
      description: 'Coordinate protests, campaigns, and actions with real-time collaboration'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Organizing',
      description: 'Protect your community with encrypted data and privacy-first design'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Impact Tracking',
      description: 'Measure engagement and see the real impact of your organizing efforts'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-primary-50 opacity-50" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Build Movements,
              <span className="text-primary-600 block">Change the World</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              rise.protest.net is the organizing platform for activists, movement builders, and changemakers. 
              Connect with your community, coordinate actions, and create lasting social impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="shadow-xl hover:shadow-2xl"
              >
                Join the Movement
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Community-powered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Open & transparent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Stay Organized
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From contact management to event coordination, our platform has all the tools you need.
            </p>
          </div>

          <div className="space-y-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-600">
                    {feature.description}
                  </p>
                  <div className="flex gap-4 pt-2">
                    {index === 0 && (
                      <>
                        <div className="flex items-center gap-2 text-slate-600">
                          <BarChart3 className="w-5 h-5" />
                          <span>Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Zap className="w-5 h-5" />
                          <span>Quick Actions</span>
                        </div>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Tag className="w-5 h-5" />
                          <span>Tags</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Search className="w-5 h-5" />
                          <span>Search</span>
                        </div>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-5 h-5" />
                          <span>Call History</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-5 h-5" />
                          <span>Engagement</span>
                        </div>
                      </>
                    )}
                    {index === 3 && (
                      <>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-5 h-5" />
                          <span>Scheduling</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-5 h-5" />
                          <span>Attendance</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl transform rotate-3 scale-105 opacity-20" />
                    <div className="relative rounded-2xl shadow-2xl w-full bg-white p-12 flex items-center justify-center min-h-[300px]">
                      <div className="text-center">
                        <div className="text-6xl mb-4">
                          {index === 0 && '📊'}
                          {index === 1 && '👥'}
                          {index === 2 && '📋'}
                          {index === 3 && '📅'}
                        </div>
                        <p className="text-gray-500">{feature.alt}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tools for Social Change
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to organize effectively and create lasting impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the growing network of activists and organizers building a better world.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="shadow-xl hover:shadow-2xl"
            >
              Start Building Your Movement
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-600">
              © 2024 rise.protest.net - Building movements for social change
            </div>
            <div className="flex gap-6">
              <a href="/privacy-policy.html" className="text-slate-600 hover:text-primary-600 transition-colors">
                Privacy
              </a>
              <a href="/terms-of-service.html" className="text-slate-600 hover:text-primary-600 transition-colors">
                Community Guidelines
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage