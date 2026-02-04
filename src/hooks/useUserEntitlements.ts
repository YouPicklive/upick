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

export function useUserEntitlements() {
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch entitlements when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEntitlements(null);
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
          // If not found, user may have signed up before trigger was added
          // Set default values - entitlements will be created by Stripe webhook on purchase
          console.info('No entitlements found for user - will be created on first purchase');
          setEntitlements(null);
        }
      } catch (err) {
        console.error('Error in fetchEntitlements:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [isAuthenticated, user]);

  // Note: Premium upgrades are handled by Stripe webhook, not client-side
  // This function is kept for UI compatibility but redirects to Stripe checkout
  const upgradeToPremium = useCallback(async () => {
    // Redirect to Stripe checkout - webhook will update entitlements
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    return { success: true, message: 'Redirecting to checkout...' };
  }, []);

  // Note: Pack purchases are handled by Stripe webhook, not client-side
  // This function is kept for UI compatibility but would redirect to Stripe
  const purchasePack = useCallback(async (packId: string) => {
    // TODO: Implement pack-specific Stripe checkout links
    console.info('Pack purchase requested:', packId);
    return { success: false, error: 'Pack purchases coming soon via Stripe' };
  }, []);

  return {
    entitlements,
    loading,
    error,
    isPremium: entitlements?.plus_active ?? false,
    ownedPacks: entitlements?.owned_packs ?? [],
    upgradeToPremium,
    purchasePack,
  };
}
