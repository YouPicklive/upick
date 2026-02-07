import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupScreenProps {
  playerCount: number;
  category: GameState['category'];
  onPlayerCountChange: (count: number) => void;
  onCategoryChange: (category: GameState['category']) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SetupScreen({
  playerCount,
  category,
  onPlayerCountChange,
  onCategoryChange,
  onContinue,
  onBack,
}: SetupScreenProps) {
  const categories = [
    { id: 'all' as const, label: 'Everything', emoji: '🎯', description: 'Mix it all up' },
    { id: 'restaurant' as const, label: 'Restaurants', emoji: '🍽️', description: 'Time to eat' },
    { id: 'activity' as const, label: 'Activities', emoji: '🎮', description: "Let's do something" },
    { id: 'bar' as const, label: 'Bars', emoji: '🍸', description: 'Drinks & vibes' },
    { id: 'cafe' as const, label: 'Cafes', emoji: '☕', description: 'Coffee & chill' },
    { id: 'nightlife' as const, label: 'Nightlife', emoji: '🌙', description: 'After dark' },
    { id: 'wellness' as const, label: 'Wellness', emoji: '🧘', description: 'Relax & recharge' },
    { id: 'brunch' as const, label: 'Brunch', emoji: '🥞', description: 'Eggs & mimosas' },
    { id: 'lunch' as const, label: 'Lunch', emoji: '🥪', description: 'Midday bites' },
    { id: 'dinner' as const, label: 'Dinner', emoji: '🍝', description: 'Evening eats' },
    { id: 'desserts' as const, label: 'Desserts', emoji: '🍨', description: 'Sweet treats' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Player Count */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-4">
          <h2 className="font-display text-xl font-bold mb-1">How many players?</h2>
          <p className="text-muted-foreground text-sm mb-5">Everyone gets a turn to vote</p>

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
                <span className="text-2xl">{['🙋', '👫', '👨‍👩‍👧', '👨‍👩‍👧‍👦'][count - 1]}</span>
                <span className="font-bold text-sm">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
          <h2 className="font-display text-xl font-bold mb-1">What are you picking?</h2>
          <p className="text-muted-foreground text-sm mb-5">Choose a category</p>

          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  category === cat.id
                    ? 'gradient-warm text-primary-foreground shadow-glow'
                    : 'bg-secondary hover:bg-secondary/80'
                } ${cat.id === 'all' ? 'col-span-2' : ''}`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-semibold text-sm">{cat.label}</span>
                <span className={`text-[11px] ${category === cat.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {cat.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Continue */}
        <Button variant="hero" size="xl" className="w-full group" onClick={onContinue}>
          Continue
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}