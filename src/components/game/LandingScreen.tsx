import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, LogOut, Star, Sparkles, Lock, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useCardDecks, CardDeck } from '@/hooks/useCardDecks';
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
  alignmentStreak?: number;
  isAuthenticated?: boolean;
}

// Deck emoji map
const DECK_EMOJI: Record<string, string> = {
  fools_journey: '🃏',
  night_out: '🌙',
  love_dating: '💕',
  what_should_i_do: '🎯',
};

export function LandingScreen({ onSoloStart, spinsRemaining, isPremium, isTrialMode, ownedPacks = [], fortunePack = 'fools_journey', onFortunePackChange, activeFilters = [], onClearFilter, onOpenPreferences, alignmentStreak = 0, isAuthenticated: isAuthProp = false }: LandingScreenProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated: isAuthHook, signOut, loading } = useAuth();
  const isAuthenticated = isAuthProp || isAuthHook;
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [showPackPurchase, setShowPackPurchase] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const spinButtonRef = useRef<HTMLDivElement>(null);

  const { decks: cardDecks, loading: decksLoading } = useCardDecks();

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
    onSoloStart(selectedVibe || undefined);
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
              Make Confident Decisions
              <br />
              <span className="text-gradient font-calligraphy font-normal text-4xl md:text-5xl"> in 60 Seconds. </span>
            </h1>
            <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
              Without endless scrolling — just clear direction on what to do next.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
              <Button variant="hero" size="lg" onClick={handleSpin} className="group">
                Start Your Daily Alignment
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Alignment Streak */}
          {isAuthenticated && alignmentStreak > 0 && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-primary">{alignmentStreak}-Day Alignment Streak</span>
              </div>
            </div>
          )}

          {/* How It Works */}
          <section id="how-it-works" className="mb-8 bg-card rounded-2xl p-5 shadow-card">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground text-center mb-4">How It Works</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">1️⃣</span>
                <p className="text-sm text-foreground">Choose your vibe</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">2️⃣</span>
                <p className="text-sm text-foreground">Narrow your options</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">3️⃣</span>
                <p className="text-sm text-foreground">Let alignment guide the decision</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
              Not random. Not overwhelming.<br />Structured clarity.
            </p>
          </section>

          {/* Vibe Section */}
          <section className="mb-8">
            <div className="text-center mb-5">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">What's the move?</h2>
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

          {/* Select a Deck */}
          <section className="mb-8">
            <DeckSelectorHome
              decks={cardDecks}
              decksLoading={decksLoading}
              selectedDeckId={fortunePack}
              isPremium={isPremium}
              ownedPacks={ownedPacks}
              onSelect={(deckId) => onFortunePackChange?.(deckId)}
              onLockedClick={() => setShowPackPurchase(true)}
            />
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

function DeckSelectorHome({
  decks,
  decksLoading,
  selectedDeckId,
  isPremium,
  ownedPacks,
  onSelect,
  onLockedClick,
}: {
  decks: CardDeck[];
  decksLoading: boolean;
  selectedDeckId: string;
  isPremium?: boolean;
  ownedPacks: string[];
  onSelect: (deckId: string) => void;
  onLockedClick: () => void;
}) {
  if (decksLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="font-display text-base font-bold mb-1">Select your deck</h3>
        <p className="text-muted-foreground text-xs mb-3">Your card will reveal after the spin.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (decks.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card">
      <h3 className="font-display text-base font-bold mb-1">Select your deck</h3>
      <p className="text-muted-foreground text-xs mb-3">Your card will reveal after the spin.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {decks.map((deck) => {
          const isSelected = selectedDeckId === deck.id;
          const isLocked = deck.tier !== 'free' && !isPremium && !ownedPacks.includes(deck.id);
          const emoji = DECK_EMOJI[deck.id] || '🃏';

          return (
            <button
              key={deck.id}
              onClick={() => isLocked ? onLockedClick() : onSelect(deck.id)}
              className={`relative p-3 rounded-xl text-left transition-all duration-200 border ${
                isSelected
                  ? 'border-primary bg-primary/8 shadow-md'
                  : isLocked
                  ? 'border-border/30 bg-card/60 opacity-60'
                  : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
              }`}
            >
              <span className="text-lg mb-1 block">{emoji}</span>
              <span className="font-semibold text-xs text-foreground block">{deck.name}</span>
              {deck.description && (
                <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">{deck.description}</span>
              )}
              {isLocked && (
                <span className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                </span>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                  </svg>
                </div>
              )}
              {deck.tier !== 'free' && !isLocked && (
                <span className="absolute top-2 right-2">
                  <Crown className="w-3 h-3 text-primary/60" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author }: {quote: string;author: string;}) {
  return (
    <div className="bg-secondary/60 rounded-2xl px-5 py-4 text-center">
      <p className="text-sm text-foreground/80 italic mb-1">"{quote}"</p>
      <p className="text-xs text-muted-foreground font-medium">— {author}</p>
    </div>);

}
