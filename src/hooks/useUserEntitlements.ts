import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

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
  
  // Use ref to track if we've already checked subscription this session
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
            ...data,
            owned_packs: data.owned_packs || [],
          });
        } else {
          logger.info('No entitlements found for user - will be created on first purchase');
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
        logger.log('[useUserEntitlements] Checking subscription status with Stripe...');
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
              ...refreshedData,
              owned_packs: refreshedData.owned_packs || [],
            });
          }
        }
      } catch (err) {
        logger.error('[useUserEntitlements] Failed to check subscription:', err);
      }
    };

    checkSubscription();
  }, [isAuthenticated, user?.id]);

  // Periodic subscription check (every 60 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke<SubscriptionStatus>('check-subscription');
        if (data) {
          setSubscriptionEnd(data.subscription_end);
        }
      } catch (err) {
        logger.error('[useUserEntitlements] Periodic check failed:', err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  // Note: Premium upgrades are handled by Stripe checkout
  const upgradeToPremium = useCallback(async () => {
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    return { success: true, message: 'Redirecting to checkout...' };
  }, []);

  // Note: Pack purchases are handled by Stripe webhook
  const purchasePack = useCallback(async (packId: string) => {
    logger.info('Pack purchase requested:', packId);
    return { success: false, error: 'Pack purchases coming soon via Stripe' };
  }, []);

  // Manually refresh subscription status
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
          ...refreshedData,
          owned_packs: refreshedData.owned_packs || [],
        });
      }
    }
  }, [user?.id]);

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
