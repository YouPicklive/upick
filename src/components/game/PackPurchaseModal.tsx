import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Check, ShoppingBag, X, Loader2 } from 'lucide-react';
import { FORTUNE_PACKS } from '@/hooks/useFortunes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const PACK_PRICES: Record<string, { price: number; label: string }> = {
  career: { price: 2.99, label: '$2.99' },
  unhinged: { price: 2.99, label: '$2.99' },
  main_character: { price: 2.99, label: '$2.99' },
};

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
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

  const purchasablePacks = FORTUNE_PACKS.filter(p =>
    p.tier === 'pack' && PACK_PRICES[p.id]
  );

  const isOwned = (packId: string) => isPremium || ownedPacks.includes(packId);

  const handlePurchasePack = async (packId: string) => {
    setLoadingPackId(packId);
    try {
      const { data, error } = await supabase.functions.invoke('create-pack-checkout', {
        body: { packId },
      });
      if (error) {
        logger.error('Checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Checkout opened in new tab!');
      }
    } catch (err) {
      logger.error('Error creating checkout:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingPackId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-2xl p-6 shadow-card-hover animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="text-center mb-5">
          <h2 className="font-display text-xl font-bold mb-1">Fortune Pack Shop</h2>
          <p className="text-muted-foreground text-sm">Buy packs or go Plus for everything</p>
        </div>

        {/* Plus Bundle */}
        {!isPremium && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm">You Pick Plus</span>
              </div>
              <div className="text-right">
                <span className="font-bold">$5.99</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">All packs + unlimited spins + premium distances</p>
            <Button onClick={onUpgradePlus} variant="hero" size="default" className="w-full">
              <Star className="w-4 h-4 mr-2" />
              Get Plus — Best Value
            </Button>
          </div>
        )}

        {!isPremium && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or buy individually</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* Individual Packs */}
        <div className="space-y-2.5">
          {purchasablePacks.map((pack) => {
            const owned = isOwned(pack.id);
            const pricing = PACK_PRICES[pack.id];

            return (
              <div
                key={pack.id}
                className={`rounded-xl p-4 transition-all ${
                  owned
                    ? 'bg-success/5 border border-success/20'
                    : 'bg-secondary/40 hover:bg-secondary/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-3xl ${owned ? '' : 'opacity-80'}`}>{pack.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm">{pack.name}</h3>
                      {owned && (
                        <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" />
                          Owned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                  </div>
                  {!owned ? (
                    <Button
                      size="sm"
                      onClick={() => handlePurchasePack(pack.id)}
                      disabled={loadingPackId === pack.id}
                      className="gradient-warm text-primary-foreground"
                    >
                      {loadingPackId === pack.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        pricing?.label || '$2.99'
                      )}
                    </Button>
                  ) : (
                    <Check className="w-5 h-5 text-success" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-5">
          One-time purchase · Yours forever
        </p>
      </div>
    </div>
  );
}