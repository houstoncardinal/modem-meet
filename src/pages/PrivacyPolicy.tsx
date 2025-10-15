import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
            <p className="text-foreground">
              We collect information you provide directly to us when you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Create an account (email, username, password)</li>
              <li>Update your profile (avatar, bio, interests, location, website)</li>
              <li>Send messages and upload files</li>
              <li>Join or create chat rooms</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
            <p className="text-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Enable communication between users</li>
              <li>Send you technical notices and support messages</li>
              <li>Monitor and analyze trends and usage</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Information Sharing</h2>
            <p className="text-foreground">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Other users as part of the service (public profile information, messages in shared rooms)</li>
              <li>Service providers who help us operate the platform</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Data Storage and Security</h2>
            <p className="text-foreground">
              We use industry-standard security measures to protect your data. Your messages and files are stored
              securely using encryption. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Your Rights and Choices</h2>
            <p className="text-foreground">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Block users you don't want to interact with</li>
              <li>Control your privacy settings</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">6. Cookies and Tracking</h2>
            <p className="text-foreground">
              We use cookies and similar tracking technologies to maintain your session and improve your experience.
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">7. Children's Privacy</h2>
            <p className="text-foreground">
              ChatLink is not intended for children under 13. We do not knowingly collect personal information
              from children under 13. If you believe we have collected such information, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">8. Data Retention</h2>
            <p className="text-foreground">
              We retain your information for as long as your account is active or as needed to provide services.
              Deleted messages and accounts are permanently removed from our servers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">9. International Data Transfers</h2>
            <p className="text-foreground">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">10. Changes to This Policy</h2>
            <p className="text-foreground">
              We may update this privacy policy from time to time. We will notify you of any changes by
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">11. Contact Us</h2>
            <p className="text-foreground">
              If you have questions about this privacy policy, please contact us through the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
