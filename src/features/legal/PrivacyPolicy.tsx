import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: May 28, 2025</p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Introduction</h2>
            <p className="mb-4">
              Catalyst Organizing Platform ("we", "our", or "us") is committed to protecting your privacy and the privacy 
              of the contacts you manage through our platform. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our organizing platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Account Information</h3>
            <p className="mb-4">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Full name and email address</li>
              <li>Organization name and details</li>
              <li>Phone number (optional)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Contact Data</h3>
            <p className="mb-4">Through your use of the platform, you may store:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Contact names, phone numbers, and email addresses</li>
              <li>Physical addresses and location data</li>
              <li>Tags, groups, and custom field data</li>
              <li>Communication history and engagement records</li>
              <li>Event attendance and volunteer activity</li>
              <li>Pathway progression and organizing metrics</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Usage Information</h3>
            <p className="mb-4">We automatically collect certain information about your device and usage:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Device type, operating system, and browser information</li>
              <li>IP address and approximate location</li>
              <li>App features used and interaction patterns</li>
              <li>Performance metrics and error reports</li>
              <li>Offline/online synchronization data</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and maintain the organizing platform</li>
              <li>Synchronize data across your devices</li>
              <li>Enable communication features (calls, texts, emails)</li>
              <li>Generate analytics and reports for your campaigns</li>
              <li>Improve platform performance and user experience</li>
              <li>Send important service updates and notifications</li>
              <li>Ensure platform security and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Storage and Security</h2>
            <p className="mb-4">We implement robust security measures to protect your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>End-to-end encryption for sensitive communications</li>
              <li>Encrypted storage using industry-standard protocols</li>
              <li>Regular security audits and penetration testing</li>
              <li>Secure authentication with multi-factor options</li>
              <li>Role-based access controls within organizations</li>
              <li>Encrypted local storage for offline functionality</li>
              <li>Automatic data backups with encryption</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information or contact data. We may share information only:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>With your explicit consent</li>
              <li>Within your organization based on permission settings</li>
              <li>With service providers who assist our operations (under strict confidentiality)</li>
              <li>To comply with legal obligations or valid legal requests</li>
              <li>To protect rights, safety, or property</li>
              <li>In connection with a merger or acquisition (with notice to users)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your Rights and Controls</h2>
            <p className="mb-4">You have comprehensive rights regarding your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> View all personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data</li>
              <li><strong>Deletion:</strong> Request removal of your personal data</li>
              <li><strong>Portability:</strong> Export your data in standard formats</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Opt out of certain data uses</li>
              <li><strong>Consent Withdrawal:</strong> Revoke previously given permissions</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Data Responsibilities</h2>
            <p className="mb-4">
              As a platform for organizing, we recognize the special responsibility of handling contact data:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You are responsible for obtaining proper consent for contact data you upload</li>
              <li>We provide tools to manage consent and communication preferences</li>
              <li>Contact data is isolated by organization with strict access controls</li>
              <li>We support compliance with regulations like GDPR, CCPA, and TCPA</li>
              <li>Bulk delete and anonymization tools are available</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Retention</h2>
            <p className="mb-4">We retain data according to the following guidelines:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Active account data: Retained while account is active</li>
              <li>Deleted data: Removed from production systems within 30 days</li>
              <li>Backups: Retained for 90 days for recovery purposes</li>
              <li>Communication logs: Retained as required by law or user settings</li>
              <li>Anonymized analytics: May be retained indefinitely</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not directed to individuals under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you become aware that a child has provided us with personal 
              information, please contact us immediately.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and maintained on servers located outside of your jurisdiction. 
              We ensure appropriate safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Standard contractual clauses approved by regulatory authorities</li>
              <li>Encryption of data in transit and at rest</li>
              <li>Limiting transfers to countries with adequate data protection</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cookies and Tracking</h2>
            <p className="mb-4">We use minimal cookies and similar technologies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Essential cookies for authentication and security</li>
              <li>Preference cookies to remember your settings</li>
              <li>Analytics cookies to improve our service (anonymized)</li>
              <li>No third-party advertising or tracking cookies</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
              <li>Requiring acknowledgment for material changes</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Open Source Commitment</h2>
            <p className="mb-4">
              As an open source platform, we believe in transparency. Our data handling practices are documented in 
              our public repository, and we welcome community review and contributions to improve privacy protections.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <div className="bg-gray-100 p-6 rounded-lg">
              <p className="mb-2">For privacy-related questions or concerns:</p>
              <p className="mb-1">Email: privacy@catalyst.org</p>
              <p className="mb-1">Data Protection Officer: dpo@catalyst.org</p>
              <p className="mb-1">Website: https://catalyst.org/privacy</p>
              <p>Mailing Address: Catalyst Privacy Team, [Address]</p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Regulatory Information</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="mb-2"><strong>For EU Residents:</strong></p>
              <p className="mb-4">
                You have rights under the General Data Protection Regulation (GDPR). 
                Contact our EU representative at eu-privacy@catalyst.org
              </p>
              
              <p className="mb-2"><strong>For California Residents:</strong></p>
              <p className="mb-4">
                You have rights under the California Consumer Privacy Act (CCPA). 
                Visit catalyst.org/privacy/california for details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}