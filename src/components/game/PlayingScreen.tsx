import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { X, Heart } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      {/* Header */}
      <div className="w-full max-w-md mb-5">
        <div className="flex items-center justify-between mb-3">
          {totalPlayers > 1 && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Player {currentPlayer} of {totalPlayers}
            </span>
          )}
          <span className="text-xs font-medium text-muted-foreground ml-auto">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-warm transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={`w-full max-w-md bg-card rounded-2xl shadow-card overflow-hidden transition-all duration-300 ${
          swipeDirection === 'left' ? 'animate-swipe-left' : ''
        } ${swipeDirection === 'right' ? 'animate-swipe-right' : ''}`}
      >
        {/* Image */}
        <div className="relative h-56">
          <img
            src={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1">
              {categoryEmojis[spot.category] || '📍'}
              {spot.cuisine || spot.category}
            </span>
            {spot.isOutdoor && (
              <span className="bg-success/90 text-success-foreground backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                🌳 Outdoor
              </span>
            )}
          </div>

          {/* Vibe */}
          <div className="absolute top-3 right-3">
            <span className="bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs">
              {spot.vibeLevel === 'chill' ? '😌' : spot.vibeLevel === 'active' ? '🏃' : spot.vibeLevel === 'dancing' ? '💃' : spot.vibeLevel === 'lazy' ? '😴' : '🎭'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-display text-xl font-bold">{spot.name}</h2>
            <div className="flex items-center gap-1 text-accent bg-accent/10 px-2.5 py-1 rounded-full text-sm">
              ⭐ <span className="font-semibold">{spot.rating}</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{spot.description}</p>

          <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < spot.priceLevel ? 'opacity-100' : 'opacity-25'}>💵</span>
              ))}
            </div>
            <span>📍 Nearby</span>
            {spot.smokingFriendly && <span>🚬</span>}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {spot.tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center justify-center gap-8 mt-8">
        <Button
          variant="swipeNo"
          size="iconLg"
          onClick={() => handleVote(false)}
          disabled={swipeDirection !== null}
        >
          <span className="text-xl">👎</span>
        </Button>
        <Button
          variant="swipeYes"
          size="iconLg"
          onClick={() => handleVote(true)}
          disabled={swipeDirection !== null}
        >
          <span className="text-xl">❤️</span>
        </Button>
      </div>

      <p className="text-muted-foreground text-xs mt-4">
        Pass · Like
      </p>
    </div>
  );
}