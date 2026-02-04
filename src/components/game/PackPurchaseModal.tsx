import { Button } from '@/components/ui/button';
import { Crown, Check, ShoppingBag, X } from 'lucide-react';
import { FORTUNE_PACKS, FortunePackInfo } from '@/hooks/useFortunes';

// Pack pricing - one-time purchases
export const PACK_PRICES: Record<string, { price: number; label: string }> = {
  love: { price: 1.99, label: '$1.99' },
  career: { price: 1.99, label: '$1.99' },
  unhinged: { price: 2.99, label: '$2.99' },
  main_character: { price: 2.99, label: '$2.99' },
};

// Stripe checkout link for fortune packs
const STRIPE_PACK_LINK = 'https://buy.stripe.com/6oUdR8fLzdfn31rfht9R603';

interface PackPurchaseModalProps {
  ownedPacks: string[];
  isPremium: boolean;
  onPurchase: (packId: string) => void;
  onUpgradePlus: () => void;
  onClose: () => void;
}

export function PackPurchaseModal({
  ownedPacks,
  isPremium,
  onPurchase,
  onUpgradePlus,
  onClose,
}: PackPurchaseModalProps) {
  // Get purchasable packs (tier === 'pack')
  const purchasablePacks = FORTUNE_PACKS.filter(p => p.tier === 'pack');

  const isOwned = (packId: string) => {
    return isPremium || ownedPacks.includes(packId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md gradient-card rounded-3xl p-6 shadow-card-hover animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <span className="text-5xl">🛒</span>
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Fortune Pack Shop</h2>
          <p className="text-muted-foreground text-sm">
            Buy individual packs or go Plus for everything!
          </p>
        </div>

        {/* Plus Bundle - Best Value */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 mb-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-purple-300">YouPick Plus</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">$4.99</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              All packs + unlimited spins + premium distances
            </p>
            <Button
              onClick={onUpgradePlus}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Crown className="w-4 h-4 mr-2" />
              Get Plus — Best Value!
            </Button>
          </div>
        )}

        {/* Divider */}
        {!isPremium && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or buy individually</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* Individual Packs */}
        <div className="space-y-3">
          {purchasablePacks.map((pack) => {
            const owned = isOwned(pack.id);
            const pricing = PACK_PRICES[pack.id];
            
            return (
              <div
                key={pack.id}
                className={`rounded-2xl p-4 transition-all ${
                  owned 
                    ? 'bg-success/10 border border-success/30' 
                    : 'bg-secondary/50 hover:bg-secondary/70'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Pack Icon */}
                  <div className={`text-4xl ${owned ? 'opacity-100' : 'opacity-80'}`}>
                    {pack.emoji}
                  </div>
                  
                  {/* Pack Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{pack.name}</h3>
                      {owned && (
                        <span className="bg-success/20 text-success text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Owned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                  </div>
                  
                  {/* Price / Buy Button */}
                  {!owned ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        // Open Stripe checkout with pack ID in client_reference_id
                        window.open(`${STRIPE_PACK_LINK}?client_reference_id=${pack.id}`, '_blank');
                      }}
                      className="gradient-warm text-primary-foreground hover:opacity-90"
                    >
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      {pricing?.label || '$1.99'}
                    </Button>
                  ) : (
                    <div className="text-success">
                      <Check className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          One-time purchase • Yours forever 💫
        </p>
      </div>
    </div>
  );
}
