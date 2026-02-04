import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { User, Users, Utensils, Gamepad2, Wine, Coffee, ArrowRight, ArrowLeft, Moon, Sparkles } from 'lucide-react';

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
    { id: 'all' as const, label: 'Everything', icon: Sparkles, description: 'Mix it all up!' },
    { id: 'restaurant' as const, label: 'Restaurants', icon: Utensils, description: 'Time to eat!' },
    { id: 'activity' as const, label: 'Activities', icon: Gamepad2, description: 'Let\'s do something' },
    { id: 'bar' as const, label: 'Bars', icon: Wine, description: 'Drinks & vibes' },
    { id: 'cafe' as const, label: 'Cafes', icon: Coffee, description: 'Coffee & chill' },
    { id: 'nightlife' as const, label: 'Nightlife', icon: Moon, description: 'After dark fun' },
    { id: 'wellness' as const, label: 'Wellness', icon: Sparkles, description: 'Relax & recharge' },
  ];

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Player Count */}
        <div className="gradient-card rounded-3xl p-8 shadow-card mb-6">
          <h2 className="text-2xl font-bold mb-2">How many players?</h2>
          <p className="text-muted-foreground mb-6">Everyone gets a turn to vote!</p>

          <div className="flex gap-4">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => onPlayerCountChange(count)}
                className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  playerCount === count
                    ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                    : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                }`}
              >
                {count === 1 ? (
                  <User className="w-8 h-8" />
                ) : (
                  <Users className="w-8 h-8" />
                )}
                <span className="font-bold text-lg">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="gradient-card rounded-3xl p-8 shadow-card mb-8">
          <h2 className="text-2xl font-bold mb-2">What are you looking for?</h2>
          <p className="text-muted-foreground mb-6">Pick a category to explore</p>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 ${
                    category === cat.id
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  } ${cat.id === 'all' ? 'col-span-2' : ''}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-bold">{cat.label}</span>
                  <span className={`text-xs ${category === cat.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {cat.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <Button variant="hero" size="xl" className="w-full" onClick={onContinue}>
          Set Your Vibe
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
