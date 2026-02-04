import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { RotateCcw, ExternalLink } from 'lucide-react';

interface ResultsScreenProps {
  winner: Spot;
  onPlayAgain: () => void;
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
};

export function ResultsScreen({ winner, onPlayAgain }: ResultsScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Floating celebration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-20 left-10 text-5xl animate-float">🎉</span>
        <span className="absolute top-32 right-16 text-4xl animate-float" style={{ animationDelay: '0.3s' }}>🎊</span>
        <span className="absolute bottom-40 left-20 text-5xl animate-float" style={{ animationDelay: '0.6s' }}>🥳</span>
        <span className="absolute bottom-32 right-12 text-4xl animate-float" style={{ animationDelay: '0.9s' }}>✨</span>
      </div>

      <div className="w-full max-w-md animate-bounce-in relative z-10">
        {/* Winner Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <span className="text-7xl">🏆</span>
            <span className="absolute -top-2 -right-2 text-3xl animate-bounce">✨</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2">We Have a Winner!</h1>
          <p className="text-muted-foreground text-lg">Time to head out! 🚗💨</p>
        </div>

        {/* Winner Card */}
        <div className="gradient-card rounded-3xl shadow-card-hover overflow-hidden mb-8">
          {/* Image */}
          <div className="relative h-56">
            <img
              src={winner.image}
              alt={winner.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            
            {/* Winner Badge */}
            <div className="absolute top-4 right-4">
              <span className="gradient-warm text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-glow">
                <span className="text-lg">🥇</span> Winner!
              </span>
            </div>

            {/* Category */}
            <div className="absolute top-4 left-4">
              <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-2xl">
                {categoryEmojis[winner.category] || '📍'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-3xl font-bold">{winner.name}</h2>
                <span className="text-primary font-semibold capitalize">
                  {winner.cuisine || winner.category}
                </span>
              </div>
              <div className="flex items-center gap-1 text-warning bg-warning/10 px-3 py-1 rounded-full">
                <span>⭐</span>
                <span className="font-bold">{winner.rating}</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-4 text-lg">{winner.description}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-base ${
                      i < winner.priceLevel ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    💵
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>📍</span>
                <span>Nearby</span>
              </div>
              {winner.isOutdoor && <span>🌳</span>}
              {winner.smokingFriendly && <span>🚬</span>}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {winner.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button variant="hero" size="xl" className="w-full group">
            <span className="text-2xl mr-2">🗺️</span>
            Get Directions
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onPlayAgain}>
            <span className="text-xl mr-2">🔄</span>
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const emojis = ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '🎈', '🥳'];
  const confettiPieces = Array.from({ length: 30 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 20}%`,
            animation: `confetti ${2 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        >
          {emojis[i % emojis.length]}
        </div>
      ))}
    </div>
  );
}
