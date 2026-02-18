import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface UserEntitlements {
  id: string;
  user_id: string;
  plus_active: boolean;
  owned_packs: string[];
  tier: string;
  unlimited_spins: boolean;
  can_save_fortunes: boolean;
  free_spin_limit_per_day: number;
  spins_used_today: number;
  spins_reset_date: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_end: string | null;
  tier?: string;
  unlimited_spins?: boolean;
  can_save_fortunes?: boolean;
  spins_used_today?: number;
  free_spin_limit_per_day?: number;
}

export function useUserEntitlements() {
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const hasCheckedSubscription = useRef(false);

  // Fetch entitlements from database
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEntitlements(null);
      hasCheckedSubscription.current = false;
      return;
    }

    const fetchEntitlements = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          logger.error('Error fetching entitlements:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (data) {
          setEntitlements({
            ...(data as any),
            owned_packs: (data as any).owned_packs || [],
            tier: (data as any).tier || 'free',
            unlimited_spins: (data as any).unlimited_spins || false,
            can_save_fortunes: (data as any).can_save_fortunes || false,
            free_spin_limit_per_day: (data as any).free_spin_limit_per_day || 1,
            spins_used_today: (data as any).spins_used_today || 0,
            spins_reset_date: (data as any).spins_reset_date || new Date().toISOString().split('T')[0],
          });
        } else {
          logger.info('No entitlements found for user');
          setEntitlements(null);
        }
      } catch (err) {
        logger.error('Error in fetchEntitlements:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [isAuthenticated, user?.id]);

  // Check subscription status on auth change
  useEffect(() => {
    if (!isAuthenticated || !user || hasCheckedSubscription.current) return;

    const checkSubscription = async () => {
      try {
        logger.log('[useUserEntitlements] Checking subscription status...');
        hasCheckedSubscription.current = true;

        const { data, error: fnError } = await supabase.functions.invoke<SubscriptionStatus>('check-subscription');

        if (fnError) {
          logger.error('[useUserEntitlements] Error checking subscription:', fnError);
          return;
        }

        if (data) {
          logger.log('[useUserEntitlements] Subscription check result:', data);
          setSubscriptionEnd(data.subscription_end);

          // Refetch entitlements after sync
          const { data: refreshedData } = await supabase
            .from('user_entitlements')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (refreshedData) {
            setEntitlements({
              ...(refreshedData as any),
              owned_packs: (refreshedData as any).owned_packs || [],
              tier: (refreshedData as any).tier || 'free',
              unlimited_spins: (refreshedData as any).unlimited_spins || false,
              can_save_fortunes: (refreshedData as any).can_save_fortunes || false,
              free_spin_limit_per_day: (refreshedData as any).free_spin_limit_per_day || 1,
              spins_used_today: (refreshedData as any).spins_used_today || 0,
              spins_reset_date: (refreshedData as any).spins_reset_date || new Date().toISOString().split('T')[0],
            });
          }
        }
      } catch (err) {
        logger.error('[useUserEntitlements] Failed to check subscription:', err);
      }
    };

    checkSubscription();
  }, [isAuthenticated, user?.id]);

  // Periodic check — only for Plus/Premium users (60s), free tier skips polling
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isPlusOrPremium = entitlements?.plus_active || entitlements?.tier === 'plus' || entitlements?.tier === 'premium';
    if (!isPlusOrPremium) return;
    
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke<SubscriptionStatus>('check-subscription');
        if (data) setSubscriptionEnd(data.subscription_end);
      } catch (err) {
        logger.error('[useUserEntitlements] Periodic check failed:', err);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, entitlements?.plus_active, entitlements?.tier]);

  const upgradeToPlus = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { returnUrl: window.location.origin + '/membership', plan: 'plus' },
    });
    if (error) {
      logger.error('Checkout error:', error);
      return { success: false, error: error.message };
    }
    if (data?.url) {
      window.location.href = data.url;
    }
    return { success: true, message: 'Redirecting to checkout...' };
  }, []);

  const upgradeToPremium = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { returnUrl: window.location.origin + '/membership', plan: 'premium' },
    });
    if (error) {
      logger.error('Checkout error:', error);
      return { success: false, error: error.message };
    }
    if (data?.url) {
      window.location.href = data.url;
    }
    return { success: true, message: 'Redirecting to checkout...' };
  }, []);

  const openCustomerPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) {
      logger.error('Portal error:', error);
      return { success: false, error: error.message };
    }
    if (data?.url) {
      window.location.href = data.url;
    }
    return { success: true };
  }, []);

  const purchasePack = useCallback(async (packId: string) => {
    logger.info('Pack purchase requested:', packId);
    return { success: false, error: 'Pack purchases coming soon via Stripe' };
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    hasCheckedSubscription.current = false;
    const { data } = await supabase.functions.invoke<SubscriptionStatus>('check-subscription');
    if (data) {
      setSubscriptionEnd(data.subscription_end);
      const { data: refreshedData } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (refreshedData) {
        setEntitlements({
          ...(refreshedData as any),
          owned_packs: (refreshedData as any).owned_packs || [],
          tier: (refreshedData as any).tier || 'free',
          unlimited_spins: (refreshedData as any).unlimited_spins || false,
          can_save_fortunes: (refreshedData as any).can_save_fortunes || false,
          free_spin_limit_per_day: (refreshedData as any).free_spin_limit_per_day || 1,
          spins_used_today: (refreshedData as any).spins_used_today || 0,
          spins_reset_date: (refreshedData as any).spins_reset_date || new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [user?.id]);

  const tier = entitlements?.tier ?? 'free';

  return {
    entitlements,
    loading,
    error,
    isPremium: tier === 'premium' || tier === 'plus' || (entitlements?.plus_active ?? false),
    isPlus: tier === 'plus' || tier === 'premium' || (entitlements?.plus_active ?? false),
    isPremiumTier: tier === 'premium',
    tier,
    unlimitedSpins: entitlements?.unlimited_spins ?? false,
    canSaveFortunes: entitlements?.can_save_fortunes ?? false,
    spinsUsedToday: entitlements?.spins_used_today ?? 0,
    freeSpinLimitPerDay: entitlements?.free_spin_limit_per_day ?? 1,
    ownedPacks: entitlements?.owned_packs ?? [],
    subscriptionEnd,
    upgradeToPlus,
    upgradeToPremium,
    openCustomerPortal,
    purchasePack,
    refreshSubscription,
  };
}
