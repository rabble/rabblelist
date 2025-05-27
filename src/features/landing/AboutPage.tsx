import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Shield, Megaphone } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <nav className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Megaphone className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">Rise.Protest.net</span>
            </Link>
            <div className="flex space-x-6">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                Home
              </Link>
              <Link to="/about" className="text-gray-800 dark:text-white font-semibold">
                About
              </Link>
              <Link to="/login" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Login
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">
            How Historical Organizing Wisdom Can Solve the Digital Crisis Moment Problem
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Social movements have just 48-72 hours to convert surge interest into lasting participation - 
              a challenge that has defined organizing success throughout history. Research into nonviolent 
              movements from the Highlander Folk School to Hong Kong's 2019 protests reveals consistent 
              patterns: successful movements combine distributed leadership, relationship-centered organizing, 
              and rapid response infrastructure.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Target className="mr-3" /> The Crisis Moment Challenge
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The crisis moment problem represents a fundamental organizing challenge that predates digital 
                technology. When Rosa Parks was arrested in 1955, the Montgomery Improvement Association had 
                to mobilize 40,000 Black residents within days through a network of churches, taxi drivers, 
                and community leaders.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When Mohamed Bouazizi's self-immolation sparked the Arab Spring in 2010, movements across 
                the Middle East faced the same conversion challenge - with dramatically different outcomes 
                based on their organizational infrastructure.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Today's movements face this challenge at unprecedented scale: the George Floyd protests drew 
                15-26 million participants across 2,000 demonstrations, creating a surge that overwhelmed 
                traditional organizing capacity.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Users className="mr-3" /> Popular Education Meets Algorithmic Organizing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The Highlander Folk School's approach to leadership development offers profound insights for 
                automated systems design. Their model rejected traditional hierarchies in favor of collective 
                knowledge building, where participants taught each other based on lived experience.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Myles Horton's principle that "the situation is there... [the school] will build its own 
                structure" suggests that effective organizing tools should adapt to local conditions rather 
                than impose rigid frameworks.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Modern movements have already begun translating these principles digitally. Adrienne Maree 
                Brown's emergent strategy framework emphasizes that "small is good, small is all" - how we 
                organize at the small scale determines large-scale success.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Strategic Escalation in the Attention Economy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Martin Luther King Jr. and the Southern Christian Leadership Conference pioneered strategic 
                campaign planning that maximized media attention and public sympathy. Their Birmingham 
                campaign in 1963 deliberately provoked dramatic confrontations that would generate national 
                outrage, converting that attention into sustained pressure for desegregation.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Contemporary movements have adapted these strategies for digital environments. Black Lives 
                Matter's hashtag activism generated 1.2 million tweets in a single day during the George 
                Floyd protests, but the movement's lasting impact came from converting digital engagement 
                into local chapter building.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The Hong Kong protests' "Be Water" strategy demonstrated how fluid, decentralized tactics 
                could sustain momentum even when prominent leaders were detained, using encrypted messaging 
                apps and hand signals to coordinate without central command.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Shield className="mr-3" /> Crisis Infrastructure for Distributed Resilience
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The most successful crisis moment responses combine technological efficiency with deep 
                organizational relationships. Ferguson activists had pre-existing networks through local 
                organizations that could immediately activate when Michael Brown was killed. Within 24 hours, 
                clear roles emerged - scouts, frontliners, medics, legal observers - that enabled sustained 
                protests for over 400 days.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Saul Alinsky's tactical principles provide a framework for automated crisis response. His 
                emphasis on "making the enemy live up to its own book of rules" translates into rapid 
                research systems that identify pressure points and accountability gaps.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Modern digital organizing has proven these principles at unprecedented scale. Fridays for 
                Future grew from Greta Thunberg's solo protest to 7.6 million participants across 185 
                countries within 13 months by creating a simple, replicable format - school strikes every 
                Friday - that provided consistent engagement opportunities.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Translating Wisdom into Automated Systems
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The synthesis of historical organizing principles with digital capabilities points toward 
                specific features for rise.protest.net. Drawing from Highlander's popular education model, 
                the platform should include peer mentorship matching that connects experienced organizers 
                with newcomers based on skills, availability, and cultural background.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Implementing emergent strategy principles requires adaptive systems that learn from each 
                crisis. The platform should track which messages, timing, and engagement sequences work 
                best in different contexts, automatically adjusting future responses.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                For rapid leadership transitions - critical when organizers face detention or burnout - 
                the system needs pre-configured delegation hierarchies that activate automatically. Drawing 
                from Hong Kong's leaderless resistance model, permissions should escalate based on engagement 
                history and peer validation rather than appointments.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Building Resilient Movement Infrastructure
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Perhaps most critically, rise.protest.net must embody the resilience that has enabled 
                movements to survive repression throughout history. This means offline-capable features 
                using mesh networking technology, encrypted communication channels that function during 
                internet shutdowns, and distributed data storage that prevents single points of failure.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Crisis moment organizing ultimately succeeds through the multiplication of human relationships. 
                Technology can accelerate and scale these connections, but cannot replace them. By encoding 
                historical organizing wisdom into automated systems, rise.protest.net can help movements 
                capture surge moments while building the deep relationships necessary for sustained change.
              </p>
            </section>

            <div className="mt-12 p-6 bg-primary-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                Ready to Transform Your Organizing?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Join movements using Catalyst to convert crisis moments into lasting change.
              </p>
              <Link 
                to="/login" 
                className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Get Started <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 Catalyst. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link to="/privacy-policy.html" className="hover:text-gray-800 dark:hover:text-gray-200">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms-of-service.html" className="hover:text-gray-800 dark:hover:text-gray-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}