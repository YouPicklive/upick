import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, LogOut, Star, Sparkles, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useFortunes, FORTUNE_PACKS } from '@/hooks/useFortunes';
import { PackPurchaseModal } from './PackPurchaseModal';
import appIcon from '@/assets/app-icon.png';
import wheelCenterIcon from '@/assets/wheel-center-icon.png';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { VibeFilter } from '@/types/game';

const VIBES = [
{ id: 'reset', name: 'Reset', subtitle: 'Ground, breathe, recalibrate.', icon: '🌿' },
{ id: 'momentum', name: 'Momentum', subtitle: 'Get moving. Build a spark.', icon: '⚡' },
{ id: 'golden_hour', name: 'Golden Hour', subtitle: 'Cinematic. Scenic. Aesthetic.', icon: '🌅' },
{ id: 'explore', name: 'Explore', subtitle: 'Unexpected. Curious. Different.', icon: '🧭' },
{ id: 'soft_social', name: 'Soft Social', subtitle: 'Connection, low pressure.', icon: '☕' },
{ id: 'full_send', name: 'Full Send', subtitle: 'Bold. Loud. Out tonight.', icon: '🔥' },
{ id: 'free_beautiful', name: 'Free & Beautiful', subtitle: 'Low-cost outdoor magic.', icon: '🌸' }] as
const;


export interface PrePickedCard {
  id: string;
  text: string;
  tags: string[];
  packId: string;
}

interface LandingScreenProps {
  onSoloStart: (selectedVibe?: string, prePickedCard?: PrePickedCard) => void;
  spinsRemaining?: number;
  isPremium?: boolean;
  isTrialMode?: boolean;
  ownedPacks?: string[];
  fortunePack?: string;
  onFortunePackChange?: (packId: string) => void;
  activeFilters?: VibeFilter[];
  onClearFilter?: (filter: VibeFilter) => void;
  onOpenPreferences?: () => void;
}

export function LandingScreen({ onSoloStart, spinsRemaining, isPremium, isTrialMode, ownedPacks = [], fortunePack = 'free', onFortunePackChange, activeFilters = [], onClearFilter, onOpenPreferences }: LandingScreenProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [showPackPurchase, setShowPackPurchase] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const spinButtonRef = useRef<HTMLDivElement>(null);

  // Pre-spin card pick state
  const { getMultipleFortunes, getPackInfo } = useFortunes();
  const [faceDownCards, setFaceDownCards] = useState<{ id: string; text: string; tags: string[] }[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [pickedCardIndex, setPickedCardIndex] = useState<number | null>(null);

  const fetchCards = useCallback(async () => {
    setCardsLoading(true);
    setPickedCardIndex(null);
    const result = await getMultipleFortunes(fortunePack, 3);
    if (!result.accessDenied) {
      setFaceDownCards(result.fortunes);
    } else {
      setFaceDownCards([]);
    }
    setCardsLoading(false);
  }, [fortunePack, getMultipleFortunes]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Show floating CTA when main spin button scrolls out of view
  useEffect(() => {
    const el = spinButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingCTA(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleVibeSelect = (vibeId: string) => {
    setSelectedVibe((prev) => prev === vibeId ? null : vibeId);
    setTimeout(() => {
      spinButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleSpin = () => {
    const prePickedCard = pickedCardIndex !== null && faceDownCards[pickedCardIndex]
      ? { ...faceDownCards[pickedCardIndex], packId: fortunePack }
      : undefined;
    onSoloStart(selectedVibe || undefined, prePickedCard);
  };

  const spinLabel = selectedVibe ?
  `Spin With ${VIBES.find((v) => v.id === selectedVibe)?.name}` :
  'Spin (Explore)';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />

      <main className="flex-1 flex flex-col px-6 pb-16">
        <div className="max-w-md mx-auto w-full">

          {/* Hero Section */}
          <div className="text-center animate-slide-up pt-6 pb-8">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3">
              YOU SET THE VIBE
              <br />
              <span className="text-gradient font-calligraphy font-normal text-4xl md:text-5xl"> The chopsticks decide </span>
            </h1>
            <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
              Alignment Through Movement — No overthinking. Just go.
            </p>
          </div>

          {/* Vibe Section */}
          <section className="mb-8">
            <div className="text-center mb-5">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">Whats the move?</h2>
              <p className="text-muted-foreground text-sm mt-1">Pick a vibe.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {VIBES.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <button
                    key={vibe.id}
                    onClick={() => handleVibeSelect(vibe.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all duration-200 border ${
                    isSelected ?
                    'border-primary bg-primary/8 shadow-md scale-[1.02]' :
                    'border-border/50 bg-card hover:border-border hover:shadow-sm'}`
                    }>

                    <span className="mb-1.5 block text-sm text-left">{vibe.icon}</span>
                    <span className="font-semibold text-sm text-foreground block">{vibe.name}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">{vibe.subtitle}</span>
                    {isSelected &&
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                        </svg>
                      </div>
                    }
                  </button>);

              })}
            </div>
          </section>

          {/* Spin Button */}
          <div ref={spinButtonRef} className="mb-8">
            {/* Status Badge */}
            <div className="flex justify-center mb-4">
              {isTrialMode &&
              <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">1 free spin — no account needed</span>
                </div>
              }
              {!isTrialMode && !isPremium && spinsRemaining !== undefined &&
              <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">
                    {spinsRemaining > 0 ?
                  <>{spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} remaining today</> :
                  <span className="text-destructive">No spins left — resets tomorrow</span>
                  }
                  </span>
                </div>
              }
              {isPremium &&
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Plus — Unlimited Spins</span>
                </div>
              }
            </div>

            <Button variant="hero" size="xl" onClick={handleSpin} className="group w-full">
              {spinLabel}
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-muted-foreground text-xs mt-2 text-center">One quick decision, guided by fate.</p>
          </div>

          {/* Pick a Card — face-down cards */}
          <section className="mb-10">
            <div className="text-center mb-4">
              <h3 className="font-display text-base font-bold text-foreground">Pick your card</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Trust your instinct — choose the one you feel drawn to.</p>
            </div>

            {cardsLoading ? (
              <div className="flex justify-center gap-4">
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} className="w-[90px] h-[130px] sm:w-[100px] sm:h-[150px] rounded-2xl" />
                ))}
              </div>
            ) : faceDownCards.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No cards available yet.</p>
            ) : (
              <div className="flex justify-center gap-4">
                {faceDownCards.map((card, i) => {
                  const isPicked = pickedCardIndex === i;
                  const isOther = pickedCardIndex !== null && pickedCardIndex !== i;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setPickedCardIndex(prev => prev === i ? null : i)}
                      className={`
                        relative w-[90px] h-[130px] sm:w-[100px] sm:h-[150px] rounded-2xl border-2
                        flex flex-col items-center justify-center
                        transition-all duration-300 outline-none
                        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                        ${isPicked
                          ? 'border-primary bg-gradient-to-b from-[hsl(var(--primary)/0.15)] to-[hsl(var(--accent)/0.08)] shadow-[0_8px_24px_hsl(var(--primary)/0.25)] -translate-y-2 scale-105'
                          : isOther
                          ? 'opacity-50 border-border/30 bg-card/40 cursor-pointer'
                          : 'border-primary/25 bg-gradient-to-b from-[hsl(var(--primary)/0.06)] to-[hsl(var(--accent)/0.04)] hover:-translate-y-1 hover:shadow-[0_6px_20px_hsl(var(--primary)/0.15)] hover:border-primary/40 cursor-pointer'
                        }
                      `}
                    >
                      {/* Breathing pulse */}
                      {!isPicked && !isOther && (
                        <div
                          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
                          style={{
                            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
                            animationDelay: `${i * 200}ms`,
                            animationDuration: '3s',
                          }}
                        />
                      )}
                      {/* Center emblem */}
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-2 transition-colors ${
                        isPicked ? 'border-primary/40 bg-primary/10' : 'border-primary/15 bg-primary/5'
                      }`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`transition-colors ${isPicked ? 'text-primary' : 'text-primary/40'}`}>
                          <path d="M12 2L14.09 8.26L20 9.27L15.5 13.14L16.91 19.02L12 16.27L7.09 19.02L8.5 13.14L4 9.27L9.91 8.26L12 2Z" fill="currentColor" />
                        </svg>
                      </div>
                      <span className={`text-[10px] font-medium tracking-widest uppercase transition-colors ${
                        isPicked ? 'text-primary' : 'text-muted-foreground/50'
                      }`}>
                        {isPicked ? '✦ Chosen' : `Card ${i + 1}`}
                      </span>
                      {/* Selection ring */}
                      {isPicked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {pickedCardIndex !== null && (
              <p className="text-center text-xs text-primary font-medium mt-3 animate-fade-in">
                Card chosen — it will reveal with your result ✨
              </p>
            )}
          </section>

          {/* Trust & Footer */}
          <div>
            <p className="text-center text-muted-foreground text-sm mb-6">
              Loved by indecisive people everywhere.
            </p>
            <div className="grid grid-cols-1 gap-3 mb-8">
              <TestimonialCard quote="Finally stopped arguing about where to eat." author="Sarah K." />
              <TestimonialCard quote="The wheel decided and honestly? Best night out ever." author="Marcus T." />
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="mailto:support@youpick.app" className="hover:text-foreground transition-colors">Contact</a>
              <span>·</span>
              <span>© {new Date().getFullYear()} You Pick</span>
            </div>
          </div>
        </div>
      </main>

      {/* Pack Purchase Modal */}
      {showPackPurchase &&
      <PackPurchaseModal
        ownedPacks={ownedPacks}
        isPremium={isPremium}
        onPurchase={(packId) => {
          onFortunePackChange?.(packId);
          setShowPackPurchase(false);
        }}
        onUpgradePlus={() => {
          navigate('/membership');
          setShowPackPurchase(false);
        }}
        onClose={() => setShowPackPurchase(false)} />
      }

      {/* Floating Spin CTA */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-md transition-all duration-300 ${
          showFloatingCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Button
          variant="hero"
          size="xl"
          onClick={handleSpin}
          className="w-full shadow-lg shadow-primary/25 group"
        >
          {spinLabel}
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>);
}

function TestimonialCard({ quote, author }: {quote: string;author: string;}) {
  return (
    <div className="bg-secondary/60 rounded-2xl px-5 py-4 text-center">
      <p className="text-sm text-foreground/80 italic mb-1">"{quote}"</p>
      <p className="text-xs text-muted-foreground font-medium">— {author}</p>
    </div>);

}
