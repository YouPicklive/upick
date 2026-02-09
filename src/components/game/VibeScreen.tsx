import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, Target, Zap } from 'lucide-react';
import { VibeIntent, VibeEnergy, VibeFilter, VibeInput, computeRandomness, RandomnessLevel } from '@/types/game';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface VibeScreenProps {
  step: 0 | 1 | 2;
  vibeInput: VibeInput;
  playerCount: number;
  onStepChange: (step: 0 | 1 | 2) => void;
  onVibeChange: (input: Partial<VibeInput>) => void;
  onPlayerCountChange: (count: number) => void;
  onStart: () => void;
  onBack: () => void;
}

const INTENTS: { id: VibeIntent; emoji: string; label: string }[] = [
  { id: 'food', emoji: '🍽️', label: 'Food' },
  { id: 'drinks', emoji: '🍸', label: 'Drinks' },
  { id: 'activity', emoji: '🎯', label: 'Activity' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { id: 'events', emoji: '🎫', label: 'Events' },
  { id: 'services', emoji: '💆', label: 'Services' },
  { id: 'surprise', emoji: '✨', label: 'Surprise Me' },
];

const ENERGIES: { id: VibeEnergy; emoji: string; label: string }[] = [
  { id: 'chill', emoji: '😌', label: 'Chill' },
  { id: 'social', emoji: '🗣️', label: 'Social' },
  { id: 'romantic', emoji: '💕', label: 'Romantic' },
  { id: 'adventure', emoji: '🧗', label: 'Adventure' },
  { id: 'productive', emoji: '💼', label: 'Productive' },
  { id: 'self-care', emoji: '🧘', label: 'Self-Care' },
  { id: 'weird', emoji: '👽', label: 'Weird' },
];

const FILTERS: { id: VibeFilter; label: string; group: string }[] = [
  { id: 'cheap', label: '💵 Cheap', group: 'budget' },
  { id: 'mid', label: '💸 Mid', group: 'budget' },
  { id: 'treat', label: '💎 Treat', group: 'budget' },
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
  onStepChange,
  onVibeChange,
  onPlayerCountChange,
  onStart,
  onBack,
}: VibeScreenProps) {
  // Scroll to top on step change
  useScrollToTop([step]);

  const randomness = computeRandomness(vibeInput);

  const handleIntentSelect = (intent: VibeIntent) => {
    onVibeChange({ intent: vibeInput.intent === intent ? null : intent });
  };

  const handleEnergySelect = (energy: VibeEnergy) => {
    onVibeChange({ energy: vibeInput.energy === energy ? null : energy });
  };

  const handleFilterToggle = (filter: VibeFilter) => {
    const current = vibeInput.filters;
    if (current.includes(filter)) {
      onVibeChange({ filters: current.filter(f => f !== filter) });
    } else if (current.length < MAX_FILTERS) {
      // Remove conflicting filters in same group
      const group = FILTERS.find(f => f.id === filter)?.group;
      const cleaned = group 
        ? current.filter(f => FILTERS.find(fl => fl.id === f)?.group !== group)
        : current;
      onVibeChange({ filters: [...cleaned, filter] });
    }
  };

  const canProceed = step === 0 ? true : step === 1 ? true : true;

  const handleNext = () => {
    if (step < 2) {
      onStepChange((step + 1) as 0 | 1 | 2);
    } else {
      onStart();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      onStepChange((step - 1) as 0 | 1 | 2);
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'gradient-warm' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Step A: Intent */}
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
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleIntentSelect(item.id)}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                        isSelected
                          ? 'gradient-warm text-primary-foreground shadow-glow'
                          : 'bg-secondary hover:bg-secondary/80'
                      } ${isWide ? 'col-span-2' : ''}`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player count */}
            <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
              <h2 className="font-display text-base font-bold mb-3">How many players?</h2>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => onPlayerCountChange(count)}
                    className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                      playerCount === count
                        ? 'gradient-warm text-primary-foreground shadow-glow'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <span className="text-xl">{['🙋', '👫', '👨‍👩‍👧', '👨‍👩‍👧‍👦'][count - 1]}</span>
                    <span className="font-bold text-xs">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <RandomnessMeter level={randomness} />
          </div>
        )}

        {/* Step B: Energy */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold mb-1">What's the energy?</h1>
              <p className="text-muted-foreground text-sm">Set the vibe for your picks</p>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
              <div className="grid grid-cols-2 gap-2.5">
                {ENERGIES.map((item) => {
                  const isSelected = vibeInput.energy === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleEnergySelect(item.id)}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${
                        isSelected
                          ? 'gradient-warm text-primary-foreground shadow-glow'
                          : 'bg-secondary hover:bg-secondary/80'
                      } ${item.id === 'weird' ? 'col-span-2' : ''}`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <RandomnessMeter level={randomness} />
          </div>
        )}

        {/* Step C: Filters */}
        {step === 2 && (
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
                {vibeInput.energy && (
                  <span className="bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                    {ENERGIES.find(e => e.id === vibeInput.energy)?.emoji} {ENERGIES.find(e => e.id === vibeInput.energy)?.label}
                  </span>
                )}
                {vibeInput.filters.map(f => (
                  <span key={f} className="bg-secondary px-3 py-1.5 rounded-full text-xs font-medium">
                    {FILTERS.find(fl => fl.id === f)?.label}
                  </span>
                ))}
                {!vibeInput.intent && !vibeInput.energy && vibeInput.filters.length === 0 && (
                  <span className="text-muted-foreground text-xs italic">No selections — full randomness!</span>
                )}
              </div>
            </div>

            <RandomnessMeter level={randomness} />
          </div>
        )}

        {/* Continue button */}
        <Button
          variant="hero"
          size="xl"
          className="w-full group mt-6"
          onClick={handleNext}
        >
          {step === 2 ? "Let's Go" : 'Continue'}
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
