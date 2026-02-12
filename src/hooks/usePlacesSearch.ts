import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Spot, VibeInput } from '@/types/game';

interface UsePlacesSearchReturn {
  searchPlaces: (coords: { latitude: number; longitude: number }, vibe: VibeInput) => Promise<Spot[]>;
  isLoading: boolean;
  error: string | null;
}

// Session-level cache to avoid redundant API calls
const cache = new Map<string, Spot[]>();

function cacheKey(lat: number, lng: number, intent: string | null): string {
  // Round coords to ~100m precision for caching
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${intent || 'surprise'}`;
}

export function usePlacesSearch(): UsePlacesSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(
    async (coords: { latitude: number; longitude: number }, vibe: VibeInput): Promise<Spot[]> => {
      const key = cacheKey(coords.latitude, coords.longitude, vibe.intent);

      // Return cached results if available
      if (cache.has(key)) {
        return cache.get(key)!;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('search-places', {
          body: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            intent: vibe.intent,
            energy: vibe.energy,
            filters: vibe.filters,
          },
        });

        if (fnError) throw fnError;

        const spots: Spot[] = (data?.spots || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category as Spot['category'],
          cuisine: undefined,
          description: s.description,
          priceLevel: s.priceLevel as Spot['priceLevel'],
          rating: s.rating,
          image: s.image || '',
          tags: s.tags || [],
          neighborhood: s.neighborhood,
          isOutdoor: s.isOutdoor ?? false,
          smokingFriendly: s.smokingFriendly ?? false,
          vibeLevel: s.vibeLevel as Spot['vibeLevel'],
          plusOnly: false,
          latitude: s.latitude,
          longitude: s.longitude,
          distance: s.distance,
        }));

        cache.set(key, spots);
        setIsLoading(false);
        return spots;
      } catch (err: any) {
        console.error('Places search failed:', err);
        setError(err.message || 'Failed to search places');
        setIsLoading(false);
        return [];
      }
    },
    []
  );

  return { searchPlaces, isLoading, error };
}
