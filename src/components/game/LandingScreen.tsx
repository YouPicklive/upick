import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, LogOut, Star, Sparkles, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FORTUNE_PACKS } from '@/hooks/useFortunes';
import { PackPurchaseModal } from './PackPurchaseModal';
import appIcon from '@/assets/app-icon.png';
import wheelCenterIcon from '@/assets/wheel-center-icon.png';
import { GlobalHeader } from '@/components/GlobalHeader';
import { CityLabel } from '@/components/CityLabel';
import { CityPickerModal } from '@/components/CityPickerModal';
import { useSelectedCity } from '@/hooks/useSelectedCity';

const VIBES = [
{ id: 'reset', name: 'Reset', subtitle: 'Ground, breathe, recalibrate.', icon: '🌿' },
{ id: 'momentum', name: 'Momentum', subtitle: 'Get moving. Build a spark.', icon: '⚡' },
{ id: 'golden_hour', name: 'Golden Hour', subtitle: 'Cinematic. Scenic. Aesthetic.', icon: '🌅' },
{ id: 'explore', name: 'Explore', subtitle: 'Unexpected. Curious. Different.', icon: '🧭' },
{ id: 'soft_social', name: 'Soft Social', subtitle: 'Connection, low pressure.', icon: '☕' },
{ id: 'full_send', name: 'Full Send', subtitle: 'Bold. Loud. Out tonight.', icon: '🔥' },
{ id: 'free_beautiful', name: 'Free & Beautiful', subtitle: 'Low-cost outdoor magic.', icon: '🌸' }] as
const;

interface LandingScreenProps {
  onSoloStart: (selectedVibe?: string) => void;
  spinsRemaining?: number;
  isPremium?: boolean;
  isTrialMode?: boolean;
  ownedPacks?: string[];
  fortunePack?: string;
  onFortunePackChange?: (packId: string) => void;
}

export function LandingScreen({ onSoloStart, spinsRemaining, isPremium, isTrialMode, ownedPacks = [], fortunePack = 'free', onFortunePackChange }: LandingScreenProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const { selectedCity, savedCities, popularCities, allCities, isPickerOpen, selectCity, clearCity, removeSavedCity, openPicker, closePicker } = useSelectedCity();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [showPackPurchase, setShowPackPurchase] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const spinButtonRef = useRef<HTMLDivElement>(null);
  const packScrollRef = useRef<HTMLDivElement>(null);

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
    // Smooth scroll to spin button
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

      <CityPickerModal
        open={isPickerOpen}
        onClose={closePicker}
        onSelectCity={selectCity}
        onUseCurrentLocation={clearCity}
        savedCities={savedCities}
        popularCities={popularCities}
        allCities={allCities}
        onRemoveSaved={removeSavedCity}
      />

      <main className="flex-1 flex flex-col px-6 pb-16">
        <div className="max-w-md mx-auto w-full">
          {/* Location Label */}
          <div className="flex justify-center pt-4 pb-2">
            <CityLabel
              label={selectedCity ? selectedCity.label : 'Use Current Location'}
              onClick={openPicker}
            />
          </div>

          {/* Hero Section */}
          <div className="text-center animate-slide-up pt-2 pb-8">
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
              <p className="text-muted-foreground text-sm mt-1">Pick a card.</p>
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

          {/* Fortune Pack Shelf */}
          <section className="mb-10">
            <div className="text-center mb-4">
              <h3 className="font-display text-base font-bold text-foreground">Fortune Packs</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Optional — guide your spin.</p>
            </div>

            <div className="relative">
              <div ref={packScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {FORTUNE_PACKS.map((pack) => {
                  const isSelected = fortunePack === pack.id;
                  const isPremiumPack = pack.tier !== 'free';
                  const isLocked = isPremiumPack && !isPremium && (pack.tier === 'plus' || !ownedPacks.includes(pack.id));
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        if (isLocked) {
                          setShowPackPurchase(true);
                          return;
                        }
                        onFortunePackChange?.(pack.id);
                      }}
                      className={`flex-shrink-0 snap-start p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 relative min-w-[80px] ${
                      isSelected && !isLocked ?
                      'gradient-warm text-primary-foreground shadow-glow' :
                      isLocked ?
                      'bg-secondary/50 opacity-70' :
                      'bg-secondary hover:bg-secondary/80'}`
                      }>

                      <span className="text-2xl">{pack.emoji}</span>
                      <span className="font-semibold text-xs">{pack.name}</span>
                      <span className={`text-[10px] ${isSelected && !isLocked ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {isLocked && pack.tier === 'pack' ? '$2.99' : isLocked && pack.tier === 'plus' ? 'Plus' : pack.description}
                      </span>
                      {isLocked &&
                      <span className="absolute top-1.5 right-1.5 text-muted-foreground/40">
                          <Lock className="w-3 h-3" />
                        </span>
                      }
                      {isSelected && !isLocked &&
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground/80">Active</span>
                      }
                    </button>);

                })}
              </div>
            </div>
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