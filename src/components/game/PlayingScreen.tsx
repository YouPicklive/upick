import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';

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
  brunch: '🥞',
  lunch: '🥗',
  dinner: '🍷',
  desserts: '🍰',
  'event-planning': '🎪',
};

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.1;

export function PlayingScreen({
  spot,
  progress,
  currentPlayer,
  totalPlayers,
  onVote,
}: PlayingScreenProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleVote = useCallback((liked: boolean) => {
    setSwipeDirection(liked ? 'right' : 'left');
    setDragOffset({ x: 0, y: 0 });
    setTimeout(() => {
      setSwipeDirection(null);
      onVote(liked);
    }, 300);
  }, [onVote]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy * 0.3 });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleVote(dragOffset.x > 0);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset.x, handleVote]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragOffset({ x: dx, y: dy * 0.3 });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleVote(dragOffset.x > 0);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset.x, handleVote]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging]);

  // Visual feedback
  const rotation = isDragging ? dragOffset.x * ROTATION_FACTOR : 0;
  const opacity = isDragging ? Math.max(0.6, 1 - Math.abs(dragOffset.x) / 400) : 1;
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
  const dislikeOpacity = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));

  const cardStyle = swipeDirection
    ? {}
    : {
        transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        opacity,
      };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center px-6 py-8 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
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
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={cardStyle}
        className={`w-full max-w-md bg-card rounded-2xl shadow-card overflow-hidden cursor-grab active:cursor-grabbing relative ${
          swipeDirection === 'left' ? 'animate-swipe-left' : ''
        } ${swipeDirection === 'right' ? 'animate-swipe-right' : ''}`}
      >
        {/* Swipe Indicators */}
        {isDragging && (
          <>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl pointer-events-none"
              style={{
                background: `hsl(var(--success) / ${likeOpacity * 0.15})`,
                border: likeOpacity > 0.3 ? `2px solid hsl(var(--success) / ${likeOpacity * 0.6})` : 'none',
              }}
            >
              {likeOpacity > 0.3 && (
                <span className="text-5xl" style={{ opacity: likeOpacity }}>❤️</span>
              )}
            </div>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl pointer-events-none"
              style={{
                background: `hsl(var(--destructive) / ${dislikeOpacity * 0.15})`,
                border: dislikeOpacity > 0.3 ? `2px solid hsl(var(--destructive) / ${dislikeOpacity * 0.6})` : 'none',
              }}
            >
              {dislikeOpacity > 0.3 && (
                <span className="text-5xl" style={{ opacity: dislikeOpacity }}>👎</span>
              )}
            </div>
          </>
        )}

        {/* Image */}
        <div className="relative h-56">
          <img
            src={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
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
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-display text-xl font-bold">{spot.name}</h2>
            <div className="flex items-center gap-1 text-accent bg-accent/10 px-2.5 py-1 rounded-full text-sm shrink-0">
              ⭐ <span className="font-semibold">{spot.rating}</span>
            </div>
          </div>

          {/* Neighborhood */}
          {spot.neighborhood && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              📍 {spot.neighborhood}
            </p>
          )}

          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{spot.description}</p>

          <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < spot.priceLevel ? 'opacity-100' : 'opacity-25'}>💵</span>
              ))}
            </div>
            {!spot.neighborhood && <span>📍 Nearby</span>}
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
        Swipe or tap · Pass · Like
      </p>
    </div>
  );
}
