import { Button } from '@/components/ui/button';
import { ArrowRight, User, LogOut, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import appIcon from '@/assets/app-icon.png';

interface LandingScreenProps {
  onSoloStart: () => void;
  spinsRemaining?: number;
  isPremium?: boolean;
  isTrialMode?: boolean;
}

export function LandingScreen({ onSoloStart, spinsRemaining, isPremium, isTrialMode }: LandingScreenProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary overflow-hidden">
            <img src={appIcon} alt="You Pick" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">You Pick</span>
        </div>
        {loading ? null : isAuthenticated ?
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            title="Sign out">

              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div> :

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth')}
          className="text-muted-foreground hover:text-foreground">

            Sign In
          </Button>
        }
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="max-w-md mx-auto text-center animate-slide-up">
          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
            YOU SET THE VIBE
            <br />
            <span className="text-gradient font-display font-light text-4xl md:text-5xl tracking-tight italic">The chopsticks decide</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto leading-relaxed">Alignment Though Movement
No overthinking. Just go.
          </p>

          {/* Wheel Visual */}
          <div className="relative mb-10">
            <div className="w-48 h-48 md:w-56 md:h-56 mx-auto relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse-glow" />
              {/* Wheel SVG */}
              <svg viewBox="0 0 200 200" className="w-full h-full animate-gentle-spin" style={{ animationDuration: '30s' }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(40, 75%, 65%)" />
                    <stop offset="50%" stopColor="hsl(32, 80%, 55%)" />
                    <stop offset="100%" stopColor="hsl(25, 78%, 48%)" />
                  </linearGradient>
                  <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(45, 80%, 72%)" />
                    <stop offset="100%" stopColor="hsl(35, 75%, 58%)" />
                  </linearGradient>
                  <linearGradient id="chopstickGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(35, 70%, 65%)" />
                    <stop offset="40%" stopColor="hsl(30, 60%, 50%)" />
                    <stop offset="100%" stopColor="hsl(25, 55%, 38%)" />
                  </linearGradient>
                </defs>
                {/* Wheel segments — warm gold palette */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const angle = i * 45 - 90;
                  const nextAngle = (i + 1) * 45 - 90;
                  const rad1 = angle * (Math.PI / 180);
                  const rad2 = nextAngle * (Math.PI / 180);
                  const x1 = 100 + 95 * Math.cos(rad1);
                  const y1 = 100 + 95 * Math.sin(rad1);
                  const x2 = 100 + 95 * Math.cos(rad2);
                  const y2 = 100 + 95 * Math.sin(rad2);
                  const colors = [
                  'hsl(38, 72%, 62%)',
                  'hsl(28, 68%, 52%)',
                  'hsl(42, 65%, 68%)',
                  'hsl(22, 70%, 48%)',
                  'hsl(35, 75%, 60%)',
                  'hsl(30, 65%, 50%)',
                  'hsl(45, 70%, 66%)',
                  'hsl(20, 72%, 46%)'];

                  return (
                    <path
                      key={i}
                      d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                      fill={colors[i]}
                      opacity={0.9} />);


                })}
                {/* Gold rim */}
                <circle cx="100" cy="100" r="95" fill="none" stroke="url(#goldLight)" strokeWidth="2.5" opacity="0.7" />
                {/* Segment lines */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const angle = (i * 45 - 90) * (Math.PI / 180);
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="100"
                      x2={100 + 95 * Math.cos(angle)}
                      y2={100 + 95 * Math.sin(angle)}
                      stroke="hsl(40, 60%, 75%)"
                      strokeWidth="0.8"
                      opacity="0.5" />);


                })}
                {/* Center circle — gold filled */}
                <circle cx="100" cy="100" r="26" fill="url(#goldGrad)" />
                <circle cx="100" cy="100" r="24" fill="hsl(38, 70%, 58%)" stroke="url(#goldLight)" strokeWidth="1.5" />
                {/* Crossed chopsticks */}
                <g transform="translate(100,100)">
                  {/* Left chopstick */}
                  <line x1="-7" y1="-16" x2="4" y2="16" stroke="hsl(45, 80%, 78%)" strokeWidth="3" strokeLinecap="round" />
                  {/* Right chopstick */}
                  <line x1="7" y1="-16" x2="-4" y2="16" stroke="hsl(45, 80%, 78%)" strokeWidth="3" strokeLinecap="round" />
                  {/* Small bright gold dot at crossing */}
                  <circle cx="0" cy="0" r="2.5" fill="hsl(45, 85%, 80%)" />
                </g>
              </svg>
            </div>
          </div>

          {/* Status Badge */}
          {isTrialMode &&
          <div className="mb-6 inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">1 free spin — no account needed</span>
            </div>
          }

          {!isTrialMode && !isPremium && spinsRemaining !== undefined &&
          <div className="mb-6 inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
              <span className="text-sm font-medium">
                {spinsRemaining > 0 ?
              <>{spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} remaining today</> :

              <span className="text-destructive">No spins left — resets tomorrow</span>
              }
              </span>
            </div>
          }

          {isPremium &&
          <div className="mb-6 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Plus — Unlimited Spins</span>
            </div>
          }

          {/* CTAs */}
          <div className="flex flex-col gap-3 w-full">
            <div className="text-center">
              <Button variant="hero" size="xl" onClick={onSoloStart} className="group w-full">
                Spin the Wheel
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-muted-foreground text-xs mt-2">One quick decision, guided by fate.</p>
            </div>



          </div>
        </div>
      </main>

      {/* Trust & Footer */}
      <footer className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Credibility */}
          <p className="text-center text-muted-foreground text-sm mb-6">
            Loved by indecisive people everywhere.
          </p>

          {/* Testimonials */}
          <div className="grid grid-cols-1 gap-3 mb-8">
            <TestimonialCard
              quote="Finally stopped arguing about where to eat."
              author="Sarah K." />

            <TestimonialCard
              quote="The wheel decided and honestly? Best night out ever."
              author="Marcus T." />

          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="mailto:support@youpick.app" className="hover:text-foreground transition-colors">Contact</a>
            <span>·</span>
            <span>© {new Date().getFullYear()} You Pick</span>
          </div>
        </div>
      </footer>
    </div>);

}

function TestimonialCard({ quote, author }: {quote: string;author: string;}) {
  return (
    <div className="bg-secondary/60 rounded-2xl px-5 py-4 text-center">
      <p className="text-sm text-foreground/80 italic mb-1">"{quote}"</p>
      <p className="text-xs text-muted-foreground font-medium">— {author}</p>
    </div>);

}
