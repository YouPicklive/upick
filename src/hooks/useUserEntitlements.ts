import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserEntitlements {
  id: string;
  user_id: string;
  plus_active: boolean;
  owned_packs: string[];
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_end: string | null;
}

export function useUserEntitlements() {
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Check subscription status directly with Stripe
  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      console.log('[useUserEntitlements] Checking subscription status with Stripe...');
      const { data, error: fnError } = await supabase.functions.invoke<SubscriptionStatus>('check-subscription');
      
      if (fnError) {
        console.error('[useUserEntitlements] Error checking subscription:', fnError);
        return;
      }

      if (data) {
        console.log('[useUserEntitlements] Subscription check result:', data);
        setSubscriptionEnd(data.subscription_end);
        
        // Refetch entitlements after sync
        await fetchEntitlements();
      }
    } catch (err) {
      console.error('[useUserEntitlements] Failed to check subscription:', err);
    }
  }, [isAuthenticated, user]);

  // Fetch entitlements from database
  const fetchEntitlements = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setEntitlements(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching entitlements:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setEntitlements({
          ...data,
          owned_packs: data.owned_packs || [],
        });
      } else {
        // Entitlements should be auto-created by database trigger on signup
        console.info('No entitlements found for user - will be created on first purchase');
        setEntitlements(null);
      }
    } catch (err) {
      console.error('Error in fetchEntitlements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch entitlements when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEntitlements(null);
      return;
    }

    fetchEntitlements();
  }, [isAuthenticated, user, fetchEntitlements]);

  // Check subscription status on auth and periodically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check subscription immediately on login
    checkSubscription();

    // Also check every 60 seconds to catch subscription changes
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, checkSubscription]);

  // Note: Premium upgrades are handled by Stripe checkout
  const upgradeToPremium = useCallback(async () => {
    // Open Stripe checkout for the $7.99/month subscription
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    return { success: true, message: 'Redirecting to checkout...' };
  }, []);

  // Note: Pack purchases are handled by Stripe webhook
  const purchasePack = useCallback(async (packId: string) => {
    console.info('Pack purchase requested:', packId);
    return { success: false, error: 'Pack purchases coming soon via Stripe' };
  }, []);

  // Manually refresh subscription status
  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  return {
    entitlements,
    loading,
    error,
    isPremium: entitlements?.plus_active ?? false,
    ownedPacks: entitlements?.owned_packs ?? [],
    subscriptionEnd,
    upgradeToPremium,
    purchasePack,
    refreshSubscription,
  };
}
