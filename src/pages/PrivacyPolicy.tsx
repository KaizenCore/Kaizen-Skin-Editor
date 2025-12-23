import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kaizen Core ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, and safeguard your information when you use Kaizen Skin Editor ("the Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-2 mt-4">2.1 Account Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you authenticate with your Microsoft/Minecraft account, we receive:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
              <li>Your Minecraft username and UUID</li>
              <li>Your Xbox Gamertag (if applicable)</li>
              <li>Access tokens for API authentication</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">2.2 User Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              We store skins and content you choose to upload to our gallery, including associated metadata
              such as upload date and creator information.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">2.3 Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may collect anonymous usage statistics to improve the Service, including feature usage patterns
              and error reports.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Enable features like the community gallery</li>
              <li>Authenticate your identity</li>
              <li>Improve and optimize the Service</li>
              <li>Communicate with you about updates or issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely on our servers. We implement industry-standard security measures
              to protect your information from unauthorized access, alteration, or destruction.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Authentication tokens are stored locally in your browser and are not accessible to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share data only:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating the Service (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To exercise these rights, please contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service uses local storage to save your preferences, authentication state, and editor settings.
              This data remains on your device and is not transmitted to our servers unless explicitly required for functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for children under 13. We do not knowingly collect personal information
              from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by posting a notice on the Service. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions or concerns about this Privacy Policy or your data, please contact us at{' '}
              <a href="mailto:contact@kaizencore.tech" className="text-primary hover:underline">
                contact@kaizencore.tech
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kaizen Core. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
