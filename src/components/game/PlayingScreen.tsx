import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { X, Heart, Star, DollarSign, MapPin } from 'lucide-react';

interface PlayingScreenProps {
  spot: Spot;
  progress: number;
  currentPlayer: number;
  totalPlayers: number;
  onVote: (liked: boolean) => void;
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
};

export function PlayingScreen({
  spot,
  progress,
  currentPlayer,
  totalPlayers,
  onVote,
}: PlayingScreenProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleVote = (liked: boolean) => {
    setSwipeDirection(liked ? 'right' : 'left');
    setTimeout(() => {
      setSwipeDirection(null);
      onVote(liked);
    }, 300);
  };

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center px-6 py-8 relative">
      {/* Floating hints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-1/4 left-4 text-5xl opacity-30 animate-pulse">👎</span>
        <span className="absolute top-1/4 right-4 text-5xl opacity-30 animate-pulse">👍</span>
      </div>

      {/* Header */}
      <div className="w-full max-w-md mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-muted-foreground">
            {totalPlayers > 1 && (
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                <span className="text-lg">🎮</span> Player {currentPlayer} of {totalPlayers}
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <span className="text-lg">📊</span> {Math.round(progress)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-warm transition-all duration-300 ease-out rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs">🔥</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className={`w-full max-w-md gradient-card rounded-3xl shadow-card-hover overflow-hidden transition-all duration-300 relative z-10 ${
          swipeDirection === 'left' ? 'animate-swipe-left' : ''
        } ${swipeDirection === 'right' ? 'animate-swipe-right' : ''}`}
      >
        {/* Image */}
        <div className="relative h-64">
          <img
            src={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold capitalize flex items-center gap-1">
              <span>{categoryEmojis[spot.category] || '📍'}</span>
              {spot.cuisine || spot.category}
            </span>
            {spot.isOutdoor && (
              <span className="bg-success/90 text-success-foreground backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                🌳 Outdoor
              </span>
            )}
          </div>

          {/* Vibe indicator */}
          <div className="absolute top-4 right-4">
            <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
              {spot.vibeLevel === 'chill' ? '😌' : spot.vibeLevel === 'active' ? '🏃' : '🎭'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-bold">{spot.name}</h2>
            <div className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded-full">
              <span className="text-sm">⭐</span>
              <span className="font-bold">{spot.rating}</span>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">{spot.description}</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < spot.priceLevel ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  💵
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>📍</span>
              <span className="text-sm">Nearby</span>
            </div>
            {spot.smokingFriendly && (
              <span className="text-sm">🚬</span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {spot.tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center justify-center gap-8 mt-8 relative z-10">
        <Button
          variant="swipeNo"
          size="iconLg"
          onClick={() => handleVote(false)}
          disabled={swipeDirection !== null}
          className="relative"
        >
          <span className="text-2xl">👎</span>
        </Button>
        <Button
          variant="swipeYes"
          size="iconLg"
          onClick={() => handleVote(true)}
          disabled={swipeDirection !== null}
          className="relative"
        >
          <span className="text-2xl">❤️</span>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-2 relative z-10">
        <span>👈</span> Pass <span className="mx-2">•</span> Like <span>👉</span>
      </p>
    </div>
  );
}
