import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { User, Users, Utensils, Gamepad2, Wine, Coffee, ArrowRight, ArrowLeft, Moon, Sparkles, Heart, Croissant, Sandwich, UtensilsCrossed, IceCream } from 'lucide-react';

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
    { id: 'all' as const, label: 'Everything', icon: Sparkles, emoji: '🎯', description: 'Mix it all up!' },
    { id: 'restaurant' as const, label: 'Restaurants', icon: Utensils, emoji: '🍽️', description: 'Time to eat!' },
    { id: 'activity' as const, label: 'Activities', icon: Gamepad2, emoji: '🎮', description: 'Let\'s do something' },
    { id: 'bar' as const, label: 'Bars', icon: Wine, emoji: '🍸', description: 'Drinks & vibes' },
    { id: 'cafe' as const, label: 'Cafes', icon: Coffee, emoji: '☕', description: 'Coffee & chill' },
    { id: 'nightlife' as const, label: 'Nightlife', icon: Moon, emoji: '🌙', description: 'After dark fun' },
    { id: 'wellness' as const, label: 'Wellness', icon: Heart, emoji: '🧘', description: 'Relax & recharge' },
    { id: 'brunch' as const, label: 'Brunch', icon: Croissant, emoji: '🥞', description: 'Eggs & mimosas' },
    { id: 'lunch' as const, label: 'Lunch', icon: Sandwich, emoji: '🥪', description: 'Midday bites' },
    { id: 'dinner' as const, label: 'Dinner', icon: UtensilsCrossed, emoji: '🍝', description: 'Evening eats' },
    { id: 'desserts' as const, label: 'Desserts', icon: IceCream, emoji: '🍨', description: 'Sweet treats' },
  ];

  const playerEmojis = ['🙋', '👫', '👨‍👩‍👧', '👨‍👩‍👧‍👦'];

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-20 right-20 text-4xl animate-float opacity-50">🎲</span>
        <span className="absolute bottom-32 left-12 text-3xl animate-float opacity-50" style={{ animationDelay: '0.8s' }}>✨</span>
      </div>

      <div className="w-full max-w-lg animate-slide-up relative z-10">
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
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-3xl">👥</span> How many players?
          </h2>
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
                <span className="text-3xl">{playerEmojis[count - 1]}</span>
                <span className="font-bold text-lg">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="gradient-card rounded-3xl p-8 shadow-card mb-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-3xl">🥢</span> What are you picking?
          </h2>
          <p className="text-muted-foreground mb-6">The toothpick will decide!</p>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
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
                  <span className="text-3xl">{cat.emoji}</span>
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
        <Button variant="hero" size="xl" className="w-full group" onClick={onContinue}>
          <span className="text-2xl mr-2">⚡</span>
          Set Your Vibe
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
