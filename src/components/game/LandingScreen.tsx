import { Button } from '@/components/ui/button';
import { Utensils, Users, ArrowRight, MapPin, Heart, Shuffle, Crown } from 'lucide-react';
import heroImage from '@/assets/hero-illustration.jpg';

interface LandingScreenProps {
  onStart: () => void;
  spinsRemaining?: number;
  isPremium?: boolean;
}

export function LandingScreen({ onStart, spinsRemaining, isPremium }: LandingScreenProps) {
  return (
    <div className="min-h-screen gradient-sunset flex flex-col">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-20 left-10 text-4xl animate-float opacity-60">🍕</span>
        <span className="absolute top-32 right-16 text-3xl animate-float opacity-60" style={{ animationDelay: '0.5s' }}>🎮</span>
        <span className="absolute top-48 left-1/4 text-3xl animate-float opacity-60" style={{ animationDelay: '1s' }}>🍜</span>
        <span className="absolute bottom-40 right-10 text-4xl animate-float opacity-60" style={{ animationDelay: '1.5s' }}>🎯</span>
        <span className="absolute bottom-32 left-16 text-3xl animate-float opacity-60" style={{ animationDelay: '0.7s' }}>🍸</span>
        <span className="absolute top-1/3 right-1/4 text-3xl animate-float opacity-60" style={{ animationDelay: '1.2s' }}>🥢</span>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          {/* Logo/Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-warm shadow-glow mb-6 relative">
              <span className="text-5xl">🥢</span>
              <span className="absolute -top-2 -right-2 text-2xl">✨</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
              <span className="text-gradient">You Pick</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-semibold flex items-center justify-center gap-2">
              <span>Can't decide? Let the toothpick decide!</span>
              <span className="text-2xl">🎲</span>
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative mb-10 animate-float">
            <img
              src={heroImage}
              alt="Food and activity icons"
              className="w-full max-w-2xl mx-auto rounded-3xl shadow-card"
            />
            <div className="absolute -bottom-4 -right-4 text-5xl">🎡</div>
            <div className="absolute -top-4 -left-4 text-4xl">🔮</div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            <FeatureCard
              emoji="👥"
              icon={<Users className="w-6 h-6" />}
              title="Solo or Group"
              description="Play alone or with friends to find the perfect spot"
            />
            <FeatureCard
              emoji="🎡"
              icon={<Shuffle className="w-6 h-6" />}
              title="Spin the Wheel"
              description="Let fate decide with our fortune wheel"
            />
            <FeatureCard
              emoji="🔮"
              icon={<MapPin className="w-6 h-6" />}
              title="Get Your Fortune"
              description="Every pick comes with today's fortune"
            />
          </div>

          {/* Spins Remaining Badge */}
          {!isPremium && spinsRemaining !== undefined && (
            <div className="mb-4 inline-flex items-center gap-2 bg-secondary/80 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-lg">🎡</span>
              <span className="text-sm font-semibold">
                {spinsRemaining > 0 ? (
                  <>{spinsRemaining} free spin{spinsRemaining !== 1 ? 's' : ''} left today</>
                ) : (
                  <span className="text-orange-400">No spins left — try again tomorrow!</span>
                )}
              </span>
            </div>
          )}

          {isPremium && (
            <div className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">YouPick Plus — Unlimited Spins!</span>
            </div>
          )}

          {/* CTA Button */}
          <Button variant="hero" size="xl" onClick={onStart} className="group">
            <span className="text-2xl mr-2 group-hover:animate-bounce">🥢</span>
            Let's Pick!
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm">
        Made with ❤️ for indecisive friends everywhere 🍴
      </footer>
    </div>
  );
}

function FeatureCard({
  emoji,
  icon,
  title,
  description,
}: {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="gradient-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:scale-105">
      <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
        {icon}
        <span className="absolute -top-2 -right-2 text-xl">{emoji}</span>
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
