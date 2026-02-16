import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Auto-posts spin results and saved places to the community feed.
 * Posts are fire-and-forget — failures are silently ignored to not disrupt UX.
 */
export function useAutoPost() {
  const { user, isAuthenticated } = useAuth();
  const postedSpins = useRef(new Set<string>());

  const postSpin = useCallback(async (spot: {
    name: string;
    id: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
  }) => {
    if (!isAuthenticated || !user) return;
    // Deduplicate within session
    if (postedSpins.current.has(spot.id)) return;
    postedSpins.current.add(spot.id);

    try {
      await supabase.from('posts' as any).insert({
        user_id: user.id,
        type: 'spin',
        place_name: spot.name,
        place_id: spot.id,
        place_category: spot.category || null,
        city: 'Richmond', // Default for V1
        latitude: spot.latitude || null,
        longitude: spot.longitude || null,
      } as any);
    } catch {
      // Silent fail
    }
  }, [isAuthenticated, user]);

  const postSave = useCallback(async (spot: {
    name: string;
    id?: string;
    category?: string;
  }) => {
    if (!isAuthenticated || !user) return;
    try {
      await supabase.from('posts' as any).insert({
        user_id: user.id,
        type: 'save',
        place_name: spot.name,
        place_id: spot.id || null,
        place_category: spot.category || null,
        city: 'Richmond',
      } as any);
    } catch {
      // Silent fail
    }
  }, [isAuthenticated, user]);

  return { postSpin, postSave };
}
