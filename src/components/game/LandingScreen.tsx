import { Button } from '@/components/ui/button';
import { Utensils, Users, Sparkles, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-illustration.jpg';

interface LandingScreenProps {
  onStart: () => void;
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="min-h-screen gradient-sunset flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          {/* Logo/Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-warm shadow-glow mb-6">
              <Utensils className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
              <span className="text-gradient">SpotPicker</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
              Can't decide where to eat or what to do?
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative mb-10 animate-float">
            <img
              src={heroImage}
              alt="Food and activity icons"
              className="w-full max-w-2xl mx-auto rounded-3xl shadow-card"
            />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Solo or Group"
              description="Play alone or with friends to find the perfect spot"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Swipe to Vote"
              description="Quick and fun voting on restaurants & activities"
            />
            <FeatureCard
              icon={<Utensils className="w-6 h-6" />}
              title="Find Your Spot"
              description="Discover the winning choice together"
            />
          </div>

          {/* CTA Button */}
          <Button variant="hero" size="xl" onClick={onStart}>
            Let's Find a Spot
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm">
        Made with ❤️ for hungry friends everywhere
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="gradient-card rounded-2xl p-6 shadow-card">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
