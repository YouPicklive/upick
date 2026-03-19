import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 19, 2026</p>

        <div className="space-y-8 text-sm">
          <Section title="1. Acceptance of Terms">
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using You Pick ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p className="text-muted-foreground leading-relaxed">
              You Pick is a decision-making and discovery application that helps users explore local experiences through spin-based recommendations, fortunes, and community features.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p className="text-muted-foreground leading-relaxed">
              You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </Section>

          <Section title="4. Subscriptions & Payments">
            <p className="text-muted-foreground leading-relaxed">
              Some features require a paid subscription. Payments are processed through Stripe. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled on a case-by-case basis.
            </p>
          </Section>

          <Section title="5. User Conduct">
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Post misleading, harmful, or inappropriate content</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p className="text-muted-foreground leading-relaxed">
              All content, branding, and materials within You Pick are owned by us or our licensors. You may not reproduce, distribute, or create derivative works without permission.
            </p>
          </Section>

          <Section title="7. Disclaimer of Warranties">
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or recommendations.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, You Pick shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </Section>

          <Section title="9. Termination">
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your access to the Service at any time for violations of these terms or for any other reason at our discretion.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p className="text-muted-foreground">
              Email: <a href="mailto:Youpicklive@gmail.com" className="text-primary hover:underline">Youpicklive@gmail.com</a>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} You Pick. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default TermsOfService;
