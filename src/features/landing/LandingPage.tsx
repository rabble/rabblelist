import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { 
  Users, 
  Phone, 
  CheckCircle,
  Shield,
  Clock,
  Target,
  ArrowRight,
  Megaphone,
  Heart,
  Globe,
  Lock,
  WifiOff,
  Activity
} from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

  const historicalLessons = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Highlander's Popular Education → Peer-to-Peer Organizing",
      quote: "The situation is there... [the school] will build its own structure",
      author: "Myles Horton",
      features: [
        "Mobile-first relationship building",
        "No app install required—PWA works offline",
        "Tap-to-call with guided conversation prompts",
        "One-tap outcome logging",
        "Notes and context flow with each contact"
      ]
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "MLK's Strategic Campaigns → Distributed Crisis Response",
      quote: "Birmingham succeeded because roles were clear within 24 hours",
      features: [
        "Auto-route new signups to local organizers",
        "Pre-configured delegation hierarchies",
        "Start calling from contact queues immediately",
        "Geographic auto-grouping",
        "Permission escalation based on engagement"
      ]
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Emergent Strategy → Leadership Multiplication",
      quote: "Small is good, small is all",
      author: "adrienne maree brown",
      features: [
        "Track progression: signup → attendance → leadership",
        "Automated mentorship matching",
        "Visible next steps for each contact",
        "A/B test engagement sequences"
      ]
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Alinsky's Power Building → Concrete Action",
      quote: "Power is not only what you have, but what the enemy thinks you have",
      author: "Saul Alinsky",
      features: [
        "Create and manage events via web or mobile",
        "QR check-in + attendance tracking",
        "View participation history",
        "Demonstrate collective strength"
      ]
    },
    {
      icon: <WifiOff className="w-6 h-6" />,
      title: "Hong Kong's 'Be Water' → Offline-First Resilience",
      quote: "Movements need infrastructure that survives internet shutdowns",
      features: [
        "All features work offline",
        "Encrypted communication channels",
        "Distributed data storage",
        "90-second signup flows during traffic spikes"
      ]
    }
  ]

  const movementWisdom = {
    worked: [
      "Montgomery Bus Boycott: Pre-existing church networks + clear roles",
      "Serbia's Otpor: Decentralized tactics + unified strategy",
      "Black Lives Matter: Chapter autonomy + shared principles",
      "Fridays for Future: Simple format + local adaptation"
    ],
    failed: [
      "Occupy Wall Street: Viral spread without engagement infrastructure",
      "Arab Spring: Toppled dictators but lacked post-revolution organizing",
      "Women's March: Massive turnout that didn't convert into sustained organizing"
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Megaphone className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Rise.Protest.net</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium hidden sm:inline">
                About
              </Link>
              <a 
                href="https://github.com/rabble/rabblelist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 font-medium hidden sm:inline"
              >
                GitHub
              </a>
              <Button 
                size="sm"
                onClick={() => navigate('/login')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Start Organizing
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Crisis Into Commitment.
              <span className="text-primary-600 block">Build Real Movement Power.</span>
            </h1>
            
            {/* History's Lesson Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ⚡ History's Lesson: You Have 48 Hours to Win or Lose
                  </h2>
                  <p className="text-gray-700 mb-3">
                    When Rosa Parks was arrested, the Montgomery Improvement Association mobilized 40,000 people in 72 hours. 
                    When Ferguson erupted, pre-existing relationships sustained 400 days of resistance. 
                    When Hong Kong faced mass arrests, their "Be Water" strategy kept the movement alive.
                  </p>
                  <p className="text-gray-900 font-semibold">
                    Today's movements face the same challenge at digital scale: <span className="text-amber-700">convert surge interest into lasting participation before the news cycle moves on.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4 mb-8">
              <p className="text-xl text-gray-600 font-medium">
                ✊ Rise isn't for fundraising or social media followers.
              </p>
              <p className="text-xl text-gray-900 font-bold">
                🛠 It's for organizers turning signups into new leaders—fast.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-xl hover:shadow-2xl flex items-center"
              >
                Start Organizing Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open('https://github.com/rabble/rabblelist', '_blank')}
                className="border-gray-300"
              >
                Explore the Code
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What History Taught Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🧩 What History Taught Us (What Rise Does)
            </h2>
          </div>

          <div className="space-y-12">
            {historicalLessons.map((lesson, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                    {lesson.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {lesson.title}
                    </h3>
                    {lesson.quote && (
                      <blockquote className="text-gray-600 italic border-l-4 border-primary-200 pl-4">
                        "{lesson.quote}" {lesson.author && `— ${lesson.author}`}
                      </blockquote>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 ml-16">
                  {lesson.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚀 See How It Works: From Viral Moment to Organized Power
            </h2>
          </div>

          {/* Crisis Response Dashboard */}
          <div className="mb-16">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gray-50 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Crisis Response Dashboard</h3>
                <p className="text-gray-600 mt-1">Your organizing command center during surge moments</p>
              </div>
              <div className="p-6">
                <img 
                  src="/dashboard.png"
                  alt="Dashboard showing organizing metrics"
                  className="w-full rounded-lg shadow-md"
                />
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">What you see at a glance:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Contact surge tracking:</strong> Real-time view of new signups to mobilize</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Active Ringers:</strong> Who's available to start calling right now</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Quick Actions:</strong> One-click access to start calling, add contacts, manage events</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Daily Goals:</strong> Track progress toward conversion targets</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Management */}
          <div className="mb-16">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gray-50 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Movement Building Analytics</h3>
                <p className="text-gray-600 mt-1">The engagement ladder in action</p>
              </div>
              <div className="p-6">
                <img 
                  src="/contacts.png"
                  alt="Contact management with tags and filters"
                  className="w-full rounded-lg shadow-md"
                />
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Smart contact organization:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Tag-based organization:</strong> Group contacts by interests, skills, and engagement level</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Advanced filtering:</strong> Find exactly who you need for specific actions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Engagement tracking:</strong> See who's ready to level up their involvement</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Quick actions:</strong> Call, message, or assign tasks with one click</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* The Ferguson Model */}
          <div className="bg-primary-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">The Ferguson Model → Digital Scale:</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Mass action/viral moment hits",
                  description: "Dashboard shows contact surge in real-time"
                },
                {
                  step: "2",
                  title: "Rise auto-triages contacts",
                  description: "Smart assignment to available Ringers"
                },
                {
                  step: "3",
                  title: "Organizers call within 2 hours",
                  description: "One-click calling with conversation guides"
                },
                {
                  step: "4",
                  title: "Contacts get specific next steps",
                  description: "Automatic progression through engagement ladder"
                },
                {
                  step: "5",
                  title: "New leaders identified",
                  description: "System flags volunteers ready for organizer roles"
                },
                {
                  step: "6",
                  title: "Base grows with each cycle",
                  description: "Analytics track sustainable power growth"
                }
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  </div>
                  <p className="text-gray-700 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Movement Wisdom Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🧭 Built on 70 Years of Movement Wisdom
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-primary-500 mr-2" />
                What Worked:
              </h3>
              <ul className="space-y-3">
                {movementWisdom.worked.map((item, idx) => (
                  <li key={idx} className="text-gray-700 pl-4 border-l-2 border-primary-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 text-red-500 mr-2">✕</span>
                What Failed:
              </h3>
              <ul className="space-y-3">
                {movementWisdom.failed.map((item, idx) => (
                  <li key={idx} className="text-gray-700 pl-4 border-l-2 border-red-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-primary-100 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-3">Rise operationalizes the lessons that build lasting power:</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Relationship-centered organizing over mass mobilization",
                "Distributed leadership that survives repression",
                "Clear engagement pathways from supporter to organizer",
                "Technology that amplifies human connections, doesn't replace them"
              ].map((lesson, idx) => (
                <div key={idx} className="flex items-start">
                  <Heart className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">{lesson}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🛡️ Designed for Movement Realities
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Secure",
                description: "End-to-end encryption, GDPR-compliant, role-based access"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Resilient",
                description: "Functions during internet shutdowns, leader detention, traffic spikes"
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Accessible",
                description: "Works on any device, any connection, any language"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Open Source",
                description: "Community-controlled, federation-ready infrastructure"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ✅ Ready to Turn Your Next Crisis Into Lasting Power?
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            Don't let another Ferguson become another Occupy.<br />
            Don't let another viral moment evaporate into hashtags.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-xl hover:shadow-2xl flex items-center"
            >
              👉 Start Organizing Now
            </Button>
            <Button 
              size="lg"
              variant="outline" 
              onClick={() => window.open('https://github.com/rabble/rabblelist', '_blank')}
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              🛠 Explore the Code
            </Button>
          </div>


          <blockquote className="mt-12 text-gray-400 italic">
            <p className="text-lg mb-2">"The most powerful weapon we have is organized people."</p>
            <cite className="text-gray-500">— Saul Alinsky</cite>
          </blockquote>
          <p className="text-primary-400 font-semibold text-xl mt-4">
            Rise is how you organize them.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600">
              rise.protest.net - Building movements for social change
            </div>
            <div className="flex gap-6">
              <a href="/privacy-policy.html" className="text-gray-600 hover:text-primary-600 transition-colors">
                Privacy
              </a>
              <a href="/terms-of-service.html" className="text-gray-600 hover:text-primary-600 transition-colors">
                Terms
              </a>
              <a 
                href="https://github.com/rabble/rabblelist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage