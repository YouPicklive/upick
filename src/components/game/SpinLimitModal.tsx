import { Button } from '@/components/ui/button';
import { Star, Zap, MapPin, Sparkles } from 'lucide-react';

interface SpinLimitModalProps {
  spinsToday: number;
  maxFreeSpins: number;
  onUpgrade: () => void;
  onClose: () => void;
}

export function SpinLimitModal({ spinsToday, maxFreeSpins, onUpgrade, onClose }: SpinLimitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-card rounded-2xl p-6 shadow-card-hover animate-slide-up">
        <div className="text-center mb-5">
          <h2 className="font-display text-xl font-bold mb-1">Out of spins</h2>
          <p className="text-muted-foreground text-sm">You've used all {maxFreeSpins} free spins today</p>
        </div>

        <div className="bg-secondary rounded-xl p-4 mb-5 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{spinsToday}/{maxFreeSpins}</div>
          <p className="text-xs text-muted-foreground">Resets at midnight</p>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm">You Pick Plus</span>
            <span className="ml-auto text-sm font-bold">$5.99/mo</span>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Unlimited spins
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-success" />
              Extended search radius
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Premium card decks
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button variant="hero" size="lg" className="w-full" onClick={onUpgrade}>
            <Star className="w-4 h-4 mr-2" />
            Upgrade to Plus
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
            Come back tomorrow
          </Button>
        </div>
      </div>
    </div>
  );
}