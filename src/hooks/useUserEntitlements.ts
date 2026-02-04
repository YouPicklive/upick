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
          // Create default entitlements for new user
          const { data: newData, error: createError } = await supabase
            .from('user_entitlements')
            .insert({
              user_id: user.id,
              plus_active: false,
              owned_packs: [],
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating entitlements:', createError);
            setError(createError.message);
          } else if (newData) {
            setEntitlements({
              ...newData,
              owned_packs: newData.owned_packs || [],
            });
          }
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

  // Upgrade to Plus
  const upgradeToPremium = useCallback(async () => {
    if (!user || !entitlements) return { success: false };

    try {
      const { error: updateError } = await supabase
        .from('user_entitlements')
        .update({ plus_active: true })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error upgrading to premium:', updateError);
        return { success: false, error: updateError.message };
      }

      setEntitlements(prev => prev ? { ...prev, plus_active: true } : null);
      return { success: true };
    } catch (err) {
      console.error('Error in upgradeToPremium:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [user, entitlements]);

  // Purchase a pack
  const purchasePack = useCallback(async (packId: string) => {
    if (!user || !entitlements) return { success: false };

    // Check if already owned
    if (entitlements.owned_packs.includes(packId)) {
      return { success: true }; // Already owned
    }

    try {
      const newOwnedPacks = [...entitlements.owned_packs, packId];

      const { error: updateError } = await supabase
        .from('user_entitlements')
        .update({ owned_packs: newOwnedPacks })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error purchasing pack:', updateError);
        return { success: false, error: updateError.message };
      }

      setEntitlements(prev => prev ? { ...prev, owned_packs: newOwnedPacks } : null);
      return { success: true };
    } catch (err) {
      console.error('Error in purchasePack:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [user, entitlements]);

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
