import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, Target, Zap, Lock, Crown } from 'lucide-react';
import { VibeIntent, VibeEnergy, VibeFilter, VibeInput, computeRandomness, RandomnessLevel, YouPickVibe, YOUPICK_VIBES } from '@/types/game';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { FORTUNE_PACKS, FortunePackInfo } from '@/hooks/useFortunes';
import { ShoppingSubcategoryModal, type ShoppingSubcategory } from './ShoppingSubcategoryModal';
import { PackPurchaseModal } from './PackPurchaseModal';

interface VibeScreenProps {
  step: 0 | 1 | 2;
  vibeInput: VibeInput;
  playerCount: number;
  fortunePack: string;
  isPremium?: boolean;
  ownedPacks?: string[];
  onStepChange: (step: 0 | 1 | 2) => void;
  onVibeChange: (input: Partial<VibeInput>) => void;
  onPlayerCountChange: (count: number) => void;
  onFortunePackChange: (packId: string) => void;
  onStart: () => void;
  onBack: () => void;
}

const INTENTS: { id: VibeIntent; emoji: string; label: string; plusOnly?: boolean }[] = [
  { id: 'food', emoji: '🍽️', label: 'Food' },
  { id: 'drinks', emoji: '🍸', label: 'Drinks' },
  { id: 'activity', emoji: '🎯', label: 'Activity' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { id: 'events', emoji: '🎫', label: 'Events' },
  { id: 'services', emoji: '💆', label: 'Wellness' },
  { id: 'surprise', emoji: '✨', label: 'Surprise Me' },
];

const FILTERS: { id: VibeFilter; label: string; group: string }[] = [
  { id: 'cheap', label: '💵 Budget', group: 'budget' },
  { id: 'mid', label: '💸 Mid', group: 'budget' },
  { id: 'treat', label: '💎 Splurge', group: 'budget' },
  { id: 'indoor', label: '🏠 Indoor', group: 'location' },
  { id: 'outdoor', label: '🌳 Outdoor', group: 'location' },
  { id: 'near-me', label: '📍 Near Me', group: 'distance' },
  { id: 'any-distance', label: '🌍 Any Distance', group: 'distance' },
];

const MAX_FILTERS = 3;

function RandomnessMeter({ level }: { level: RandomnessLevel }) {
  const config = {
    wild: { label: 'Wild', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', width: 'w-full' },
    balanced: { label: 'Balanced', icon: Zap, color: 'text-accent', bg: 'bg-accent/10', width: 'w-2/3' },
    specific: { label: 'Specific', icon: Target, color: 'text-success', bg: 'bg-success/10', width: 'w-1/3' },
  };
  const c = config[level];
  const Icon = c.icon;

  return (
    <div className={`${c.bg} rounded-2xl px-4 py-3 flex items-center gap-3`}>
      <Icon className={`w-4 h-4 ${c.color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold ${c.color}`}>Randomness: {c.label}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${c.width} gradient-warm`} />
        </div>
      </div>
    </div>
  );
}

export function VibeScreen({
  step,
  vibeInput,
  playerCount,
  fortunePack,
  isPremium = false,
  ownedPacks = [],
  onStepChange,
  onVibeChange,
  onPlayerCountChange,
  onFortunePackChange,
  onStart,
  onBack,
}: VibeScreenProps) {
  useScrollToTop([step]);

  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showPackPurchase, setShowPackPurchase] = useState(false);

  const randomness = computeRandomness(vibeInput);

  const handleIntentSelect = (intent: VibeIntent) => {
    if (intent === 'shopping') {
      if (vibeInput.intent === 'shopping') {
        onVibeChange({ intent: null, shoppingSubcategory: null });
      } else {
        setShowShoppingModal(true);
      }
      return;
    }
    onVibeChange({ intent: vibeInput.intent === intent ? null : intent, shoppingSubcategory: null });
  };

  const handleShoppingSubcategorySelect = (sub: ShoppingSubcategory) => {
    onVibeChange({ intent: 'shopping', shoppingSubcategory: sub });
    setShowShoppingModal(false);
  };

  const handleFilterToggle = (filter: VibeFilter) => {
    const current = vibeInput.filters;
    if (current.includes(filter)) {
      onVibeChange({ filters: current.filter(f => f !== filter) });
    } else if (current.length < MAX_FILTERS) {
      const group = FILTERS.find(f => f.id === filter)?.group;
      const cleaned = group 
        ? current.filter(f => FILTERS.find(fl => fl.id === f)?.group !== group)
        : current;
      onVibeChange({ filters: [...cleaned, filter] });
    }
  };

  const handleNext = () => {
    if (step < 1) {
      onStepChange(1 as 0 | 1 | 2);
    } else {
      // Default vibe to 'explore' if none selected from landing
      if (!vibeInput.selectedVibe) {
        onVibeChange({ selectedVibe: 'explore' });
      }
      onStart();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      onStepChange(0 as 0 | 1 | 2);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? 'Back' : 'Home'}
        </button>

        {/* Step indicator — 2 steps now */}
        <div className="flex items-center gap-2 mb-6">
          {[0, 1].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'gradient-warm' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold mb-1">What are you looking for?</h1>
              <p className="text-muted-foreground text-sm">Pick one, or let fate decide</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
              <div className="grid grid-cols-2 gap-2.5">
                {INTENTS.map((item) => {
                  const isSelected = vibeInput.intent === item.id;
                  const isWide = item.id === 'surprise';
                  const isLocked = item.plusOnly && !isPremium;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isLocked && handleIntentSelect(item.id)}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 relative ${
                        isLocked
                          ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                          : isSelected
                          ? 'gradient-warm text-primary-foreground shadow-glow'
                          : 'bg-secondary hover:bg-secondary/80'
                      } ${isWide ? 'col-span-2' : ''}`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-semibold text-sm">{item.label}</span>
                      {item.plusOnly && (
                        <span className={`absolute top-1.5 right-1.5 ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`}>
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5 text-accent" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <RandomnessMeter level={randomness} />
          </div>
        )}

        {/* Step 1: Filters + Fortune Pack (was step 2) */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold mb-1">Any preferences?</h1>
              <p className="text-muted-foreground text-sm">Optional — pick up to 3 or skip for more randomness</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
              <div className="flex flex-wrap gap-2.5">
                {FILTERS.map((item) => {
                  const isSelected = vibeInput.filters.includes(item.id);
                  const isDisabled = !isSelected && vibeInput.filters.length >= MAX_FILTERS;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isDisabled && handleFilterToggle(item.id)}
                      disabled={isDisabled}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'gradient-warm text-primary-foreground shadow-glow'
                          : isDisabled
                          ? 'bg-secondary/40 text-muted-foreground/50 cursor-not-allowed'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {vibeInput.filters.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {vibeInput.filters.length}/{MAX_FILTERS} filters selected
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
              <h2 className="font-display text-base font-bold mb-3">Your vibe</h2>
              <div className="flex flex-wrap gap-2">
                {vibeInput.intent && (
                  <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                    {INTENTS.find(i => i.id === vibeInput.intent)?.emoji} {INTENTS.find(i => i.id === vibeInput.intent)?.label}
                  </span>
                )}
                {vibeInput.selectedVibe && (
                  <span className="bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                    {YOUPICK_VIBES.find(v => v.id === vibeInput.selectedVibe)?.emoji} {YOUPICK_VIBES.find(v => v.id === vibeInput.selectedVibe)?.label}
                  </span>
                )}
                {vibeInput.filters.map(f => (
                  <span key={f} className="bg-secondary px-3 py-1.5 rounded-full text-xs font-medium">
                    {FILTERS.find(fl => fl.id === f)?.label}
                  </span>
                ))}
                {!vibeInput.intent && !vibeInput.selectedVibe && vibeInput.filters.length === 0 && (
                  <span className="text-muted-foreground text-xs italic">No selections — full randomness!</span>
                )}
              </div>
            </div>

            <RandomnessMeter level={randomness} />

            {/* Fortune Pack Selector */}
            <div className="bg-card rounded-2xl p-5 shadow-card mt-4">
              <h2 className="font-display text-base font-bold mb-1">Fortune Pack</h2>
              <p className="text-muted-foreground text-xs mb-3">Pick a fortune theme for your spin</p>
              <div className="grid grid-cols-2 gap-2.5">
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
                        onFortunePackChange(pack.id);
                      }}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 relative ${
                        isSelected && !isLocked
                          ? 'gradient-warm text-primary-foreground shadow-glow'
                          : isLocked
                          ? 'bg-secondary/50 opacity-70'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span className="text-2xl">{pack.emoji}</span>
                      <span className="font-semibold text-xs">{pack.name}</span>
                      <span className={`text-[10px] ${isSelected && !isLocked ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {isLocked && pack.tier === 'pack' ? '$2.99' : isLocked && pack.tier === 'plus' ? 'Plus' : pack.description}
                      </span>
                      {isLocked && (
                        <span className="absolute top-1.5 right-1.5 text-muted-foreground/40">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Continue button */}
        <Button
          variant="hero"
          size="xl"
          className="w-full group mt-6"
          onClick={handleNext}
        >
          {step === 1 ? "Let's Go" : 'Continue'}
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Shopping Subcategory Modal */}
      {showShoppingModal && (
        <ShoppingSubcategoryModal
          onSelect={handleShoppingSubcategorySelect}
          onClose={() => setShowShoppingModal(false)}
        />
      )}

      {/* Pack Purchase Modal */}
      {showPackPurchase && (
        <PackPurchaseModal
          ownedPacks={ownedPacks}
          isPremium={isPremium}
          onPurchase={(packId) => {
            onFortunePackChange(packId);
            setShowPackPurchase(false);
          }}
          onUpgradePlus={() => {
            window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
            setShowPackPurchase(false);
          }}
          onClose={() => setShowPackPurchase(false)}
        />
      )}
    </div>
  );
}
