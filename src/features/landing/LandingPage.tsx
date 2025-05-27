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
      icon: <Zap className="w-6 h-6" />,
      title: 'Works Offline',
      description: 'Access your contacts and data anywhere, even without internet'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with role-based access'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile First',
      description: 'Designed for mobile devices with responsive layouts'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Work together with team members on shared contacts and events'
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
              Organize Your Community,
              <span className="text-primary-600 block">Amplify Your Impact</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              The powerful contact management system designed for organizers, activists, and community builders. 
              Manage contacts, track engagement, and coordinate events - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="shadow-xl hover:shadow-2xl"
              >
                Get Started Free
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
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Free forever</span>
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
                    <img 
                      src={feature.screenshot}
                      alt={feature.alt}
                      className="relative rounded-2xl shadow-2xl w-full h-auto"
                      loading="lazy"
                    />
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
              Built for Modern Organizers
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features designed with your workflow in mind.
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
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of organizers who are building stronger communities with our platform.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="shadow-xl hover:shadow-2xl"
            >
              Start Organizing Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-600">
              © 2024 Contact Manager PWA. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="/privacy-policy.html" className="text-slate-600 hover:text-primary-600 transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service.html" className="text-slate-600 hover:text-primary-600 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage