import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Zap, MapPin, Sparkles, Bookmark, Crown, Loader2, CreditCard, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { GlobalHeader } from '@/components/GlobalHeader';
import { toast } from 'sonner';

export default function Membership() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    isPlus, isPremiumTier, tier, subscriptionEnd, ownedPacks,
    upgradeToPlus, upgradeToPremium, openCustomerPortal, refreshSubscription,
    loading,
  } = useUserEntitlements();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('🎉 Welcome!', { description: 'Your membership is now active.' });
      refreshSubscription();
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === 'cancel') {
      toast.info('Checkout cancelled');
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleUpgradePlus = async () => { await upgradeToPlus(); };
  const handleUpgradePremium = async () => { await upgradeToPremium(); };
  const handleManageBilling = async () => {
    const result = await openCustomerPortal();
    if (result && !result.success && result.error) {
      toast.error('Could not open billing portal', { description: result.error });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentTierLabel = isPremiumTier ? 'YouPick Premium' : isPlus ? 'YouPick Plus' : 'Free Plan';
  const currentTierDesc = isPremiumTier ? 'Worldwide access unlocked' : isPlus ? 'All US features unlocked' : '1 spin per day';

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-md mx-auto px-6 py-8">
        <h1 className="font-display text-xl font-bold mb-6">Membership</h1>

        {/* Current Plan Card */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          isPlus ? 'gradient-warm text-primary-foreground border-primary/20' : 'bg-card border-border'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {isPlus ? <Crown className="w-6 h-6" /> : <Star className="w-6 h-6 text-muted-foreground" />}
            <div>
              <h2 className="font-display text-xl font-bold">{currentTierLabel}</h2>
              <p className={`text-sm ${isPlus ? 'opacity-80' : 'text-muted-foreground'}`}>
                {currentTierDesc}
              </p>
            </div>
          </div>
          {isPlus && subscriptionEnd && (
            <p className="text-sm opacity-75 mt-2">Renews {new Date(subscriptionEnd).toLocaleDateString()}</p>
          )}
        </div>

        {/* Plus Tier Card */}
        {!isPlus && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-4">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> YouPick Plus — $5.99/mo
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-5">
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-accent shrink-0" /> Unlimited spins, every day</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 shrink-0" style={{ color: 'hsl(152, 55%, 42%)' }} /> Extended search radius (US)</li>
              <li className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary shrink-0" /> All premium fortune packs</li>
              <li className="flex items-center gap-3"><Bookmark className="w-4 h-4 text-accent shrink-0" /> Save your favorite fortunes</li>
            </ul>
            <Button variant="hero" size="lg" className="w-full" onClick={handleUpgradePlus}>
              <Star className="w-4 h-4 mr-2" /> Upgrade to Plus
            </Button>
          </div>
        )}

        {/* Premium Tier Card */}
        {!isPremiumTier && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Global
            </div>
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" /> YouPick Premium — $10.99/mo
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-5">
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-accent shrink-0" /> Everything in Plus</li>
              <li className="flex items-center gap-3"><Globe className="w-4 h-4 text-accent shrink-0" /> Search cities worldwide</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-accent shrink-0" /> International discovery & events</li>
              <li className="flex items-center gap-3"><Crown className="w-4 h-4 text-accent shrink-0" /> Priority access to new features</li>
            </ul>
            <Button variant="hero" size="lg" className="w-full" onClick={handleUpgradePremium}>
              <Globe className="w-4 h-4 mr-2" /> {isPlus ? 'Upgrade to Premium' : 'Go Premium'}
            </Button>
          </div>
        )}

        {isPlus && (
          <Button variant="outline" size="lg" className="w-full mb-4" onClick={handleManageBilling}>
            <CreditCard className="w-4 h-4 mr-2" /> Manage Billing
          </Button>
        )}

        {ownedPacks.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Owned Fortune Packs</h3>
            <div className="flex flex-wrap gap-2">
              {ownedPacks.map(pack => (
                <span key={pack} className="bg-secondary px-3 py-1.5 rounded-full text-sm font-medium capitalize">{pack.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => navigate('/profile')}>Edit Profile</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => navigate('/saved')}>Saved Fortunes</Button>
        </div>
      </main>
    </div>
  );
}
