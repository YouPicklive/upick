import { Button } from '@/components/ui/button';
import { Crown, Zap, MapPin, Sparkles } from 'lucide-react';

interface SpinLimitModalProps {
  spinsToday: number;
  maxFreeSpins: number;
  onUpgrade: () => void;
  onClose: () => void;
}

export function SpinLimitModal({ spinsToday, maxFreeSpins, onUpgrade, onClose }: SpinLimitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm gradient-card rounded-3xl p-6 shadow-card-hover animate-bounce-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-4">
            <div className="relative">
              <span className="text-6xl">🥢</span>
              <span className="absolute -top-2 -right-2 text-2xl">😴</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Toothpick Needs Rest!</h2>
          <p className="text-muted-foreground">
            You've used all {maxFreeSpins} free spins today
          </p>
        </div>

        {/* Stats */}
        <div className="bg-secondary/50 rounded-2xl p-4 mb-6 text-center">
          <div className="text-4xl font-bold text-primary mb-1">{spinsToday}/{maxFreeSpins}</div>
          <p className="text-sm text-muted-foreground">Spins used today</p>
          <p className="text-xs text-muted-foreground mt-2">Resets at midnight ⏰</p>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-purple-300">YouPick Plus</span>
            <span className="ml-auto text-sm font-bold text-white">$4.99/mo</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Unlimited spins</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-green-400" />
              <span>Road Trip & Epic Adventure radius</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Premium fortune packs</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button 
            variant="default"
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            onClick={onUpgrade}
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Plus
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-muted-foreground"
            onClick={onClose}
          >
            Come back tomorrow
          </Button>
        </div>
      </div>
    </div>
  );
}
