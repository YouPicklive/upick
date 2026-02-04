import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { RotateCcw, ExternalLink } from 'lucide-react';
import { FortuneWheel } from './FortuneWheel';
import { getRandomFortune } from '@/data/fortunes';

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
  const [showWheel, setShowWheel] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Start spinning after a brief delay
    const spinTimer = setTimeout(() => {
      setSpinning(true);
    }, 500);

    return () => clearTimeout(spinTimer);
  }, []);

  const handleSpinComplete = () => {
    setShowConfetti(true);
    setFortune(getRandomFortune());
    
    setTimeout(() => {
      setShowWheel(false);
      setShowResult(true);
    }, 1500);

    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Create wheel items from winner name (we just show the winner spinning to build suspense)
  const wheelItems = [winner.name, '???', winner.name, '???', winner.name, '???'];

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

      {/* Wheel Phase */}
      {showWheel && (
        <div className="w-full max-w-md animate-bounce-in relative z-10 text-center">
          <div className="mb-6">
            <span className="text-5xl mb-4 block">🥢</span>
            <h1 className="text-3xl font-extrabold mb-2">The Toothpick Decides...</h1>
            <p className="text-muted-foreground">Spinning the wheel of fortune!</p>
          </div>

          <FortuneWheel
            items={wheelItems}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
          />

          {!spinning && (
            <p className="mt-6 text-muted-foreground animate-pulse">
              Get ready... 🎡
            </p>
          )}
        </div>
      )}

      {/* Result Phase */}
      {showResult && (
        <div className="w-full max-w-md animate-bounce-in relative z-10">
          {/* Winner Header */}
          <div className="text-center mb-6">
            <div className="inline-block mb-4 relative">
              <span className="text-7xl">🏆</span>
              <span className="absolute -top-2 -right-2 text-3xl animate-bounce">✨</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">The Toothpick Has Spoken!</h1>
            <p className="text-muted-foreground text-lg">Time to head out! 🚗💨</p>
          </div>

          {/* Fortune Cookie */}
          <div className="gradient-warm rounded-2xl p-4 mb-6 shadow-glow text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🥠</span>
              <span className="text-primary-foreground font-bold">Today's Fortune</span>
              <span className="text-2xl">🥠</span>
            </div>
            <p className="text-primary-foreground/90 italic text-lg">"{fortune}"</p>
          </div>

          {/* Winner Card */}
          <div className="gradient-card rounded-3xl shadow-card-hover overflow-hidden mb-6">
            {/* Image */}
            <div className="relative h-48">
              <img
                src={winner.image}
                alt={winner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              
              {/* Winner Badge */}
              <div className="absolute top-4 right-4">
                <span className="gradient-warm text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-glow">
                  <span className="text-lg">🥇</span> The Pick!
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
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{winner.name}</h2>
                  <span className="text-primary font-semibold capitalize">
                    {winner.cuisine || winner.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-warning bg-warning/10 px-3 py-1 rounded-full">
                  <span>⭐</span>
                  <span className="font-bold">{winner.rating}</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-3">{winner.description}</p>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < winner.priceLevel ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      💵
                    </span>
                  ))}
                </div>
                <span>📍 Nearby</span>
                {winner.isOutdoor && <span>🌳</span>}
                {winner.smokingFriendly && <span>🚬</span>}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {winner.tags.slice(0, 3).map((tag) => (
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
              Pick Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const emojis = ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '🥢', '🥠'];
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
