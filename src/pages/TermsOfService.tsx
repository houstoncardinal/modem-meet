import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-card border-2 border-primary p-8 space-y-6">
          <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-foreground">
              By accessing and using ChatLink, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Use License</h2>
            <p className="text-foreground">
              Permission is granted to temporarily use ChatLink for personal, non-commercial transitory viewing only.
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. User Conduct</h2>
            <p className="text-foreground">
              You agree not to use ChatLink to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Harass, abuse, or harm another person</li>
              <li>Post or transmit any unlawful, threatening, or harmful content</li>
              <li>Impersonate any person or entity</li>
              <li>Upload viruses or malicious code</li>
              <li>Spam or send unsolicited messages</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Account Termination</h2>
            <p className="text-foreground">
              We reserve the right to terminate or suspend your account immediately, without prior notice or liability,
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Content</h2>
            <p className="text-foreground">
              You retain ownership of content you post. By posting content, you grant ChatLink a worldwide,
              non-exclusive license to use, reproduce, and distribute your content in connection with the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">6. Disclaimer</h2>
            <p className="text-foreground">
              The service is provided "as is" without warranties of any kind, either express or implied.
              ChatLink does not warrant that the service will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">7. Limitations</h2>
            <p className="text-foreground">
              In no event shall ChatLink be liable for any damages arising out of the use or inability to use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">8. Changes to Terms</h2>
            <p className="text-foreground">
              We reserve the right to modify these terms at any time. We will notify users of any changes by
              posting the new Terms of Service on this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">9. Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about these Terms, please contact us through the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
