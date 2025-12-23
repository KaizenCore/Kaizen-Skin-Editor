import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Kaizen Skin Editor ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kaizen Skin Editor is a web-based application that allows users to create, edit, and manage Minecraft skins.
              The Service includes features such as skin editing tools, a community gallery, and integration with Minecraft accounts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of the Service, you may be required to authenticate using your Microsoft/Minecraft account.
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any skins or content you create using the Service. By uploading content to our gallery,
              you grant Kaizen Core a non-exclusive, worldwide license to display and distribute your content within the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              You agree not to upload content that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
              <li>Infringes on intellectual property rights</li>
              <li>Contains offensive, hateful, or inappropriate material</li>
              <li>Violates any applicable laws or regulations</li>
              <li>Contains malicious code or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its design, features, and underlying technology, is owned by Kaizen Core.
              Minecraft is a trademark of Mojang Studios. We are not affiliated with or endorsed by Mojang or Microsoft.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" without warranties of any kind. Kaizen Core shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting.
              Your continued use of the Service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{' '}
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
