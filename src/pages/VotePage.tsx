import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { useVoteSession, VoteTally } from '@/hooks/useVoteSession';
import { SpotImage } from '@/components/game/SpotImage';
import { Check, Loader2, ExternalLink } from 'lucide-react';

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

export default function VotePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    session,
    voteTally,
    totalVoters,
    hasVoted,
    loading,
    loadSession,
    castVote,
    startPolling,
    stopPolling,
  } = useVoteSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [votingComplete, setVotingComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Swipe state
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
      startPolling(sessionId);
    }
    return () => stopPolling();
  }, [sessionId]);

  const options = session?.options_json || [];
  const currentSpot = options[currentIndex] || null;

  const handleVote = useCallback((liked: boolean) => {
    if (!currentSpot) return;
    setSwipeDirection(liked ? 'right' : 'left');
    setDragOffset({ x: 0, y: 0 });

    if (liked) {
      setLikedIds(prev => [...prev, currentSpot.id]);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      if (currentIndex + 1 >= options.length) {
        // Done swiping — submit the liked one with highest priority (or random)
        const finalLiked = liked ? [...likedIds, currentSpot.id] : likedIds;
        submitVote(finalLiked);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  }, [currentSpot, currentIndex, options.length, likedIds]);

  const submitVote = async (liked: string[]) => {
    if (!sessionId) return;
    setSubmitting(true);
    // Pick a random liked option as the vote, or if none liked, pick random option
    const pick = liked.length > 0
      ? liked[Math.floor(Math.random() * liked.length)]
      : options[Math.floor(Math.random() * options.length)]?.id;

    if (pick) {
      await castVote(sessionId, pick);
    }
    setVotingComplete(true);
    setSubmitting(false);
  };

  // Touch/mouse handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startPos.current.x;
    const dy = e.touches[0].clientY - startPos.current.y;
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

  // Loading state
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Session closed — show winner
  if (session.status === 'closed') {
    const winner = session.options_json.find(s => s.id === session.winner_option_id);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-scale-in text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h1 className="font-display text-2xl font-bold mb-2">The group has spoken!</h1>
          {winner ? (
            <div className="bg-card rounded-2xl p-5 shadow-card mt-6">
              <img src={winner.image} alt={winner.name} className="w-full h-48 object-cover rounded-xl mb-4" />
              <h2 className="font-display text-xl font-bold mb-1">{winner.name}</h2>
              <p className="text-muted-foreground text-sm">{winner.description}</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                <span>⭐ {winner.rating}</span>
                <span className="w-px h-3 bg-border" />
                <span>{Array.from({ length: winner.priceLevel }).map(() => '$').join('')}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Winner has been chosen!</p>
          )}
        </div>
      </div>
    );
  }

  // Already voted — waiting
  if (hasVoted || votingComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-scale-in text-center">
          <span className="text-5xl mb-4 block">✅</span>
          <h1 className="font-display text-2xl font-bold mb-2">Vote received!</h1>
          <p className="text-muted-foreground text-sm mb-6">Waiting for others…</p>
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <p className="text-muted-foreground text-xs mb-2">Votes so far</p>
            <span className="font-display text-4xl font-bold text-primary">{totalVoters}</span>
            <span className="text-muted-foreground text-lg"> / {session.expected_voter_count}</span>
          </div>
        </div>
      </div>
    );
  }

  // Voting — show cards
  if (!currentSpot) return null;

  const progress = ((currentIndex) / options.length) * 100;
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
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            Group Vote
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-warm transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
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
              {likeOpacity > 0.3 && <span className="text-5xl" style={{ opacity: likeOpacity }}>❤️</span>}
            </div>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl pointer-events-none"
              style={{
                background: `hsl(var(--destructive) / ${dislikeOpacity * 0.15})`,
                border: dislikeOpacity > 0.3 ? `2px solid hsl(var(--destructive) / ${dislikeOpacity * 0.6})` : 'none',
              }}
            >
              {dislikeOpacity > 0.3 && <span className="text-5xl" style={{ opacity: dislikeOpacity }}>👎</span>}
            </div>
          </>
        )}

        {/* Image */}
        <div className="relative h-56">
          <SpotImage src={currentSpot.image} alt={currentSpot.name} category={currentSpot.category} className="w-full h-full pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1">
              {categoryEmojis[currentSpot.category] || '📍'}
              {currentSpot.cuisine || currentSpot.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-display text-xl font-bold">{currentSpot.name}</h2>
            <div className="flex items-center gap-1 text-accent bg-accent/10 px-2.5 py-1 rounded-full text-sm shrink-0">
              ⭐ <span className="font-semibold">{currentSpot.rating}</span>
            </div>
          </div>
          {currentSpot.neighborhood && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">📍 {currentSpot.neighborhood}</p>
          )}
          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{currentSpot.description}</p>
          <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < currentSpot.priceLevel ? 'opacity-100' : 'opacity-25'}>💵</span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentSpot.tags.map((tag) => (
              <span key={tag} className="bg-secondary px-2.5 py-1 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center justify-center gap-8 mt-8">
        <Button variant="swipeNo" size="iconLg" onClick={() => handleVote(false)} disabled={swipeDirection !== null}>
          <span className="text-xl">👎</span>
        </Button>
        <Button variant="swipeYes" size="iconLg" onClick={() => handleVote(true)} disabled={swipeDirection !== null}>
          <span className="text-xl">❤️</span>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs mt-4">Swipe or tap · Pass · Like</p>
    </div>
  );
}
