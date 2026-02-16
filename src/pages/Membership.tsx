import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Zap, MapPin, Sparkles, Bookmark, Crown, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { toast } from 'sonner';

export default function Membership() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    isPremium, tier, subscriptionEnd, ownedPacks,
    upgradeToPremium, openCustomerPortal, refreshSubscription,
    loading,
  } = useUserEntitlements();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Handle checkout result
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('🎉 Welcome to Plus!', { description: 'Your membership is now active.' });
      refreshSubscription();
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === 'cancel') {
      toast.info('Checkout cancelled');
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleUpgrade = async () => {
    await upgradeToPremium();
  };

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

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold">Membership</h1>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* Current Plan Card */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          isPremium
            ? 'gradient-warm text-primary-foreground border-primary/20'
            : 'bg-card border-border'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {isPremium ? (
              <Crown className="w-6 h-6" />
            ) : (
              <Star className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <h2 className="font-display text-xl font-bold">
                {isPremium ? 'YouPick Plus' : 'Free Plan'}
              </h2>
              <p className={`text-sm ${isPremium ? 'opacity-80' : 'text-muted-foreground'}`}>
                {isPremium ? 'All features unlocked' : '1 spin per day'}
              </p>
            </div>
          </div>

          {isPremium && subscriptionEnd && (
            <p className="text-sm opacity-75 mt-2">
              Renews {new Date(subscriptionEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Plus Benefits */}
        {!isPremium && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-6">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              YouPick Plus — $5.99/mo
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-5">
              <li className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-accent shrink-0" />
                Unlimited spins, every day
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-success shrink-0" />
                Extended search radius
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                All premium fortune packs
              </li>
              <li className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-accent shrink-0" />
                Save your favorite fortunes
              </li>
            </ul>

            <Button variant="hero" size="lg" className="w-full" onClick={handleUpgrade}>
              <Star className="w-4 h-4 mr-2" />
              Upgrade to Plus
            </Button>
          </div>
        )}

        {/* Manage Billing */}
        {isPremium && (
          <Button variant="outline" size="lg" className="w-full mb-4" onClick={handleManageBilling}>
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
        )}

        {/* Owned Packs */}
        {ownedPacks.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
              Owned Fortune Packs
            </h3>
            <div className="flex flex-wrap gap-2">
              {ownedPacks.map(pack => (
                <span key={pack} className="bg-secondary px-3 py-1.5 rounded-full text-sm font-medium capitalize">
                  {pack.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="mt-8 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => navigate('/profile')}>
            Edit Profile
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => navigate('/saved')}>
            Saved Fortunes
          </Button>
        </div>
      </main>
    </div>
  );
}
