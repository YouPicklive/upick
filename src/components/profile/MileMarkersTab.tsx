import { useMileMarkers } from '@/hooks/useMileMarkers';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MileMarkersTabProps {
  userId: string;
}

const REASON_LABELS: Record<string, string> = {
  daily_open: 'Daily visit',
  spin: 'Spin',
  save: 'Saved a spot',
  like: 'Liked a post',
  share: 'Shared',
  checkin: 'Check-in',
  redeem_reward: 'Redeemed reward',
};

export function MileMarkersTab({ userId: _userId }: MileMarkersTabProps) {
  const navigate = useNavigate();
  const { balance, lifetimePoints, transactions, rewards, isPlus, loading, redeemReward } = useMileMarkers();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  if (!isPlus) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">🏁 Mile Markers</h3>
        <p className="text-sm text-muted-foreground mb-1">Mile Markers are included with Plus ($5.99/mo)</p>
        <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto">
          Earn points for every spin, save, like, and share — then redeem for real rewards from local businesses.
        </p>
        <Button variant="hero" onClick={() => navigate('/membership')}>
          Upgrade to Plus →
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const progressPct = Math.min((balance / 500) * 100, 100);

  return (
    <div className="space-y-5 py-2">
      {/* Balance card */}
      <div className="bg-card rounded-2xl p-5 shadow-card text-center">
        <p className="text-5xl font-display font-bold text-foreground">{balance}</p>
        <p className="text-sm font-medium text-primary mt-1">Mile Markers</p>
        <p className="text-xs text-muted-foreground mt-0.5">Lifetime: {lifetimePoints} pts</p>
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Progress to first reward</p>
          <p className="text-xs text-muted-foreground">{balance}/500 pts</p>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full gradient-warm transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Rewards marketplace */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="font-display text-base font-bold mb-3">Rewards Marketplace</h3>
        <div className="space-y-3">
          {rewards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No rewards available yet</p>
          )}
          {rewards.map(reward => {
            const canAfford = balance >= reward.points_cost;
            const inStock = reward.quantity_available > 0;
            return (
              <div key={reward.id} className="border border-border/50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{reward.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>
                    <p className="text-xs font-medium text-primary mt-1.5">{reward.points_cost} pts</p>
                  </div>
                  <div className="shrink-0">
                    {!inStock ? (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Out of stock</span>
                    ) : !canAfford ? (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        Need {reward.points_cost - balance} more pts
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={redeeming === reward.id}
                        onClick={async () => {
                          setRedeeming(reward.id);
                          await redeemReward(reward.id);
                          setRedeeming(null);
                        }}
                      >
                        {redeeming === reward.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Redeem'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="font-display text-base font-bold mb-3">History</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet — start spinning to earn! 🏁</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm text-foreground">{REASON_LABELS[tx.reason] ?? tx.reason}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'earn' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
