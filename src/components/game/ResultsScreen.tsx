import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { Trophy, Star, DollarSign, MapPin, RotateCcw, ExternalLink, PartyPopper } from 'lucide-react';

interface ResultsScreenProps {
  winner: Spot;
  onPlayAgain: () => void;
}

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

      <div className="w-full max-w-md animate-bounce-in">
        {/* Winner Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-warm shadow-glow mb-4">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2">We Have a Winner!</h1>
          <p className="text-muted-foreground text-lg">Time to head out! 🎉</p>
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
                <PartyPopper className="w-4 h-4" />
                Winner!
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
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{winner.rating}</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-4 text-lg">{winner.description}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <DollarSign
                    key={i}
                    className={`w-5 h-5 ${
                      i < winner.priceLevel ? 'text-foreground' : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span>Nearby</span>
              </div>
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
          <Button variant="hero" size="xl" className="w-full">
            <ExternalLink className="w-5 h-5 mr-2" />
            Get Directions
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onPlayAgain}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
  const confettiPieces = Array.from({ length: 50 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 20}%`,
            animation: `confetti ${2 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
