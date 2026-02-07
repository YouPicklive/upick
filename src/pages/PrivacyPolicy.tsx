import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: February 4, 2026</p>

        <div className="space-y-8 text-sm">
          <Section title="1. Introduction">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to You Pick ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and website (collectively, the "Service").
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p className="text-muted-foreground leading-relaxed mb-3">When you create an account or make a purchase, we may collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Account preferences and settings</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Personalize your experience</li>
              <li>Monitor and analyze usage trends</li>
            </ul>
          </Section>

          <Section title="4. Payment Processing">
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed through Stripe. We do not store credit card information. See{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Stripe's privacy policy
              </a>.
            </p>
          </Section>

          <Section title="5. Data Sharing">
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your information. We share data only with service providers (e.g., Stripe), when required by law, or in connection with business transfers.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate security measures to protect your information. No method of transmission is 100% secure.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may access, correct, delete your data, or withdraw consent. Contact us at support@youpick.app.
            </p>
          </Section>

          <Section title="8. Contact">
            <p className="text-muted-foreground">
              Email: <a href="mailto:support@youpick.app" className="text-primary hover:underline">support@youpick.app</a>
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

export default PrivacyPolicy;