import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { ArrowLeft } from 'lucide-react'

export function TermsOfService() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: May 28, 2025</p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Catalyst Organizing Platform ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use the Service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Catalyst is a comprehensive organizing platform designed for community organizations, campaigns, and grassroots movements. 
              The Service provides tools for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Contact management and relationship building</li>
              <li>Campaign creation and management</li>
              <li>Phone banking and text messaging</li>
              <li>Event organization and attendance tracking</li>
              <li>Volunteer coordination and pathway management</li>
              <li>Data synchronization across devices</li>
              <li>Offline functionality for field organizing</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="mb-4">To use certain features of the Service, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Comply with your organization's data handling policies</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree to use the Service only for lawful organizing activities and not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on the rights or privacy of others</li>
              <li>Harass, spam, or send unsolicited communications</li>
              <li>Store or transmit malicious code</li>
              <li>Interfere with the Service's operation</li>
              <li>Attempt to gain unauthorized access to any systems</li>
              <li>Use the Service for commercial solicitation without consent</li>
              <li>Misrepresent your organization or campaign</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data and Privacy</h2>
            <p className="mb-4">
              Your use of the Service is governed by our Privacy Policy. By using the Service, you acknowledge:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>The importance of respecting contact privacy and consent</li>
              <li>Your responsibility to comply with applicable data protection laws</li>
              <li>That you have obtained necessary permissions for contact data you upload</li>
              <li>The secure storage of data on encrypted cloud servers</li>
              <li>Local device storage capabilities for offline functionality</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Catalyst and are protected by 
              international copyright, trademark, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. User Content</h2>
            <p className="mb-4">
              You retain ownership of any content you submit to the Service. By submitting content, you grant us a license to 
              use, store, and backup your content as necessary to provide the Service. You are responsible for ensuring you 
              have the right to upload any content.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Organization Responsibilities</h2>
            <p className="mb-4">If you are using the Service on behalf of an organization:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You represent that you have authority to bind the organization to these Terms</li>
              <li>The organization is responsible for all users under its account</li>
              <li>The organization must ensure compliance with applicable laws regarding data collection and communication</li>
              <li>The organization is responsible for training users on proper data handling</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Communication Compliance</h2>
            <p className="mb-4">When using communication features (calls, texts, emails), you agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Comply with all applicable laws including TCPA, CAN-SPAM, and GDPR</li>
              <li>Honor opt-out requests promptly</li>
              <li>Maintain accurate do-not-contact lists</li>
              <li>Use communication features only for legitimate organizing purposes</li>
              <li>Respect time-of-day restrictions for communications</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
            </p>
            <ul className="list-disc pl-6 mb-4 uppercase">
              <li>The Service will be uninterrupted or error-free</li>
              <li>The Service will meet your specific requirements</li>
              <li>The results obtained will be accurate or reliable</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CATALYST SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold harmless Catalyst from any claims, damages, or expenses arising from your 
              use of the Service or violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Termination</h2>
            <p className="mb-4">We may terminate or suspend your account for violation of these Terms. Upon termination:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your right to use the Service will cease immediately</li>
              <li>You may request export of your data within 30 days</li>
              <li>We may delete your data after 60 days</li>
              <li>Provisions that should survive termination will remain in effect</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via 
              email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15. Open Source</h2>
            <p className="mb-4">
              Catalyst is built with open source principles. Certain components may be available under open source licenses, 
              which will be clearly marked. Your use of open source components is governed by their respective licenses.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States and the State 
              of California, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17. Contact Information</h2>
            <div className="bg-gray-100 p-6 rounded-lg">
              <p className="mb-2">For questions about these Terms, please contact us at:</p>
              <p className="mb-1">Email: legal@catalyst.org</p>
              <p className="mb-1">Website: https://catalyst.org/support</p>
              <p>Open Source Repository: https://github.com/catalyst-org/catalyst</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}