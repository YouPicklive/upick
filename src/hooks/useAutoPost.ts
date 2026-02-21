import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGeolocation } from './useGeolocation';

/**
 * Records spin events and triggers feed posting via edge function.
 * Fire-and-forget — failures are silently ignored to not disrupt UX.
 */
export function useAutoPost() {
  const { user, isAuthenticated } = useAuth();
  const { coordinates } = useGeolocation();
  const postedSpins = useRef(new Set<string>());

  const postSpin = useCallback(async (spot: {
    name: string;
    id: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
  }, options?: { shouldPost?: boolean; caption?: string }) => {
    if (!isAuthenticated || !user) return;
    if (postedSpins.current.has(spot.id)) return;
    postedSpins.current.add(spot.id);

    const shouldPost = options?.shouldPost ?? true;

    try {
      const { data, error } = await supabase.from('spin_events' as any).insert({
        user_id: user.id,
        place_id: spot.id,
        place_name: spot.name,
        category: spot.category || null,
        lat: spot.latitude || null,
        lng: spot.longitude || null,
        city: 'Near You',
        region: null,
        should_post_to_feed: shouldPost,
        caption: options?.caption || null,
      } as any).select('id').single();

      if (error || !data) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      fetch(`${supabaseUrl}/functions/v1/post-spin-to-feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spin_event_id: (data as any).id }),
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  }, [isAuthenticated, user]);

  const postSave = useCallback(async (spot: {
    name: string;
    id?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!isAuthenticated || !user) return;
    try {
      await supabase.from('feed_posts' as any).insert({
        user_id: user.id,
        post_type: 'save',
        title: `Saved ${spot.name} 📌`,
        result_place_id: spot.id || null,
        result_name: spot.name,
        result_category: spot.category || null,
        lat: spot.latitude || null,
        lng: spot.longitude || null,
        city: 'Near You',
        region: null,
        visibility: 'public',
      } as any);
    } catch {
      // Silent fail
    }
  }, [isAuthenticated, user]);

  return { postSpin, postSave };
}
