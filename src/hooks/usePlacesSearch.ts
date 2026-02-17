import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Spot, VibeInput } from '@/types/game';
import { logger } from '@/lib/logger';
import { isValidSpotForIntent } from '@/lib/category-rules';
import fallbackHollywoodCemetery from '@/assets/fallback-hollywood-cemetery.jpg';
import fallbackLibbyHill from '@/assets/fallback-libby-hill.jpg';
import fallbackBelleIsle from '@/assets/fallback-belle-isle.jpg';
import fallbackCanalWalk from '@/assets/fallback-canal-walk.jpg';
import fallbackJamesRiverPark from '@/assets/fallback-james-river-park.jpg';
import fallbackMaymontPark from '@/assets/fallback-maymont-park.jpg';

interface UsePlacesSearchReturn {
  searchPlaces: (coords: { latitude: number; longitude: number }, vibe: VibeInput) => Promise<Spot[]>;
  isLoading: boolean;
  error: string | null;
}

// Session-level cache to avoid redundant API calls
const cache = new Map<string, Spot[]>();

function cacheKey(lat: number, lng: number, intent: string | null, shoppingSub?: string | null): string {
  // Round coords to ~100m precision for caching
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${intent || 'surprise'}_${shoppingSub || ''}`;
}

// ── Free + Outdoor guardrail ──────────────────────────────────────────

// Types that MUST be excluded (checked against category + tags, all lowercased)
const EXCLUDE_TYPES = new Set([
  'bar', 'pub', 'night_club', 'nightlife', 'liquor_store', 'brewery',
  'restaurant', 'cafe', 'fast_food', 'meal_takeaway', 'meal_delivery',
  'food_truck', 'food-truck', 'bakery', 'brunch', 'lunch', 'dinner',
  'desserts', 'cocktail-lounge', 'wine-bar', 'dive-bar', 'rooftop-bar',
]);

// Name substrings that indicate food/drink establishment
const EXCLUDE_NAME_KEYWORDS = [
  'bar', 'tavern', 'pub', 'lounge', 'grill', 'brew', 'taproom',
  'cantina', 'saloon', 'bistro', 'buffalo wild wings', 'bww',
  "mcdonald", 'taco bell', "wendy", 'burger king', 'kfc', 'subway',
  'chipotle', "chick-fil-a", "popeye", "domino", "pizza hut",
  "applebee", "ihop", "denny", "waffle house", "five guys",
  "shake shack", "panera", "starbucks", "dunkin", 'restaurant',
  'cafe', 'diner', 'eatery', 'kitchen', 'pizz', 'wings', 'burger',
  'taqueria', 'sushi', 'ramen', 'pho', 'wok', 'noodle',
];

// The ONLY types allowed through for free+outdoor combo
const ALLOWED_OUTDOOR_TYPES = new Set([
  'park', 'natural_feature', 'hiking_area', 'campground', 'garden',
  'tourist_attraction', 'trail', 'hiking', 'museum', 'art_gallery',
  'nature', 'free', 'outdoor', 'scenic', 'river', 'walk', 'hike',
]);

export const FREE_OUTDOOR_FALLBACKS: Spot[] = [
  {
    id: 'fallback-hollywood-cemetery',
    name: 'Walk Hollywood Cemetery + find the best view',
    category: 'activity',
    description: 'Historic cemetery with river views and peaceful trails',
    priceLevel: 1,
    rating: 4.8,
    image: fallbackHollywoodCemetery,
    tags: ['Free', 'Outdoor', 'Scenic', 'Walk'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
    neighborhood: 'Oregon Hill',
  },
  {
    id: 'fallback-libby-hill',
    name: 'Sunset at Libby Hill Park',
    category: 'activity',
    description: 'Iconic Richmond skyline view at golden hour',
    priceLevel: 1,
    rating: 4.9,
    image: fallbackLibbyHill,
    tags: ['Free', 'Outdoor', 'Sunset', 'Views'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
    neighborhood: 'Church Hill',
  },
  {
    id: 'fallback-belle-isle',
    name: 'Belle Isle loop walk',
    category: 'activity',
    description: 'River island with trails, rocks, and swimming spots',
    priceLevel: 1,
    rating: 4.7,
    image: fallbackBelleIsle,
    tags: ['Free', 'Outdoor', 'Nature', 'Hike'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'active',
    neighborhood: 'Belle Isle',
  },
  {
    id: 'fallback-canal-walk',
    name: 'Walk Canal Walk and people-watch',
    category: 'activity',
    description: 'Scenic canal-side path through downtown Richmond',
    priceLevel: 1,
    rating: 4.5,
    image: fallbackCanalWalk,
    tags: ['Free', 'Outdoor', 'Walk', 'Downtown'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
    neighborhood: 'Downtown',
  },
  {
    id: 'fallback-james-river-park',
    name: 'James River Park — find a rock and sit',
    category: 'activity',
    description: 'Sprawling river park system with endless spots to explore',
    priceLevel: 1,
    rating: 4.8,
    image: fallbackJamesRiverPark,
    tags: ['Free', 'Outdoor', 'River', 'Nature'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
    neighborhood: 'James River',
  },
  {
    id: 'fallback-maymont-park',
    name: 'Explore Maymont Park and the Japanese Garden',
    category: 'activity',
    description: 'Free historic estate with gardens, animals, and trails',
    priceLevel: 1,
    rating: 4.9,
    image: fallbackMaymontPark,
    tags: ['Free', 'Outdoor', 'Garden', 'Animals'],
    isOutdoor: true,
    smokingFriendly: false,
    vibeLevel: 'chill',
    neighborhood: 'Byrd Park',
  },
];

// ── Free-only keywords ──────────────────────────────────────────────
const FREE_DESCRIPTION_KEYWORDS = [
  'free', 'no cost', 'public', 'park', 'trail', 'walk', 'overlook',
  'self-guided', 'community', 'museum free day', 'open space',
];
const PAID_DESCRIPTION_KEYWORDS = [
  'ticket', 'admission', 'fee', 'reservation required', 'per person',
  'cover charge', 'entry fee',
];

export const FREE_GENERAL_FALLBACKS: Spot[] = [
  {
    id: 'free-fallback-scenic-trail', name: 'Walk a scenic trail nearby', category: 'activity',
    description: 'Find the nearest trail and let your feet lead the way. Free, always.',
    priceLevel: 1, rating: 4.8, image: '', tags: ['100% Free', 'Outdoor', 'Walk'],
    isOutdoor: true, smokingFriendly: false, vibeLevel: 'chill',
  },
  {
    id: 'free-fallback-public-park', name: 'Visit a public park', category: 'activity',
    description: 'Green space, fresh air, zero cost. Just show up.',
    priceLevel: 1, rating: 4.7, image: '', tags: ['100% Free', 'Outdoor', 'Nature'],
    isOutdoor: true, smokingFriendly: false, vibeLevel: 'chill',
  },
  {
    id: 'free-fallback-sunset', name: 'Watch sunset from the best overlook', category: 'activity',
    description: 'The sky puts on a free show every evening. Go witness it.',
    priceLevel: 1, rating: 4.9, image: '', tags: ['100% Free', 'Outdoor', 'Scenic'],
    isOutdoor: true, smokingFriendly: false, vibeLevel: 'chill',
  },
  {
    id: 'free-fallback-gallery', name: 'Explore a free gallery or museum day', category: 'activity',
    description: 'Many museums offer free admission days. Today could be one.',
    priceLevel: 1, rating: 4.6, image: '', tags: ['100% Free', 'Art', 'Culture'],
    isOutdoor: false, smokingFriendly: false, vibeLevel: 'chill',
  },
  {
    id: 'free-fallback-grounding', name: 'Touch a tree — grounding moment', category: 'activity',
    description: 'Find a big old tree. Put your hand on it. Breathe. That\'s it.',
    priceLevel: 1, rating: 4.5, image: '', tags: ['100% Free', 'Wellness', 'Nature'],
    isOutdoor: true, smokingFriendly: false, vibeLevel: 'lazy',
  },
  {
    id: 'free-fallback-historic-walk', name: 'Self-guided historic walk', category: 'activity',
    description: 'Pick a neighborhood with old buildings. Walk slowly. Read the plaques.',
    priceLevel: 1, rating: 4.6, image: '', tags: ['100% Free', 'Walk', 'History'],
    isOutdoor: true, smokingFriendly: false, vibeLevel: 'chill',
  },
];

/**
 * Determines if the free-only price guardrail should apply.
 * Condition: price filter is "cheap"
 */
export function shouldApplyFreeGuardrail(vibe: VibeInput): boolean {
  return vibe.filters.includes('cheap');
}

/**
 * Strict free-only filter: removes any spot that isn't genuinely free.
 * Checks priceLevel, description keywords, and tags.
 */
export function applyFreeOnlyGuardrail(spots: Spot[]): Spot[] {
  return spots.filter(spot => {
    // Must be priceLevel 1 (cheapest tier)
    if (spot.priceLevel > 1) return false;

    // Check description for paid signals
    const descLower = (spot.description || '').toLowerCase();
    if (PAID_DESCRIPTION_KEYWORDS.some(kw => descLower.includes(kw))) return false;

    // Bonus: keep if description has free signals or tags include "Free"
    const hasFreeSignal =
      FREE_DESCRIPTION_KEYWORDS.some(kw => descLower.includes(kw)) ||
      spot.tags.some(t => t.toLowerCase().includes('free'));

    // For priceLevel 1 spots, keep them — they represent budget/free tier
    // But if they explicitly mention paid keywords, they were already excluded above
    return true;
  });
}

/**
 * Determines if the "free + outdoor" guardrail should apply.
 * Condition: price filter is "cheap" AND (outdoor filter OR free-beautiful vibe OR surprise intent)
 */
export function shouldApplyFreeOutdoorGuardrail(vibe: VibeInput): boolean {
  const isFreePrice = vibe.filters.includes('cheap');
  if (!isFreePrice) return false;

  const isFreeBeautifulVibe = vibe.selectedVibe === 'free-beautiful';
  const isSurpriseIntent = vibe.intent === 'surprise' || vibe.intent === null;

  return isFreeBeautifulVibe || isSurpriseIntent;
}

/**
 * Normalizes all type info from a spot into a single lowercase array.
 */
function normalizeTypes(spot: Spot): string[] {
  const types: string[] = [];
  if (spot.category) types.push(spot.category.toLowerCase());
  if (spot.tags) {
    for (const t of spot.tags) {
      types.push(t.toLowerCase().replace(/\s+/g, '_'));
    }
  }
  return types;
}

/**
 * Filters out restaurants/bars/chains and keeps only outdoor-appropriate results.
 * Returns { kept, debugLog } for logging.
 */
export function applyFreeOutdoorGuardrail(spots: Spot[]): Spot[] {
  const results: Spot[] = [];

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const types = normalizeTypes(spot);
    const nameLower = spot.name.toLowerCase();
    let excluded = false;
    let rule = '';

    // Rule A: Exclude by type
    if (!excluded && types.some(t => EXCLUDE_TYPES.has(t))) {
      excluded = true;
      rule = `type match: ${types.filter(t => EXCLUDE_TYPES.has(t)).join(',')}`;
    }

    // Rule B: Exclude by name keyword
    if (!excluded && EXCLUDE_NAME_KEYWORDS.some(kw => nameLower.includes(kw))) {
      excluded = true;
      rule = `name match: ${EXCLUDE_NAME_KEYWORDS.find(kw => nameLower.includes(kw))}`;
    }

    // Rule C: Must have at least one allowed outdoor type
    if (!excluded && !types.some(t => ALLOWED_OUTDOOR_TYPES.has(t))) {
      excluded = true;
      rule = `no allowed outdoor type in: [${types.join(',')}]`;
    }


    if (!excluded) {
      results.push(spot);
    }
  }

  
  return results;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function usePlacesSearch(): UsePlacesSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(
    async (coords: { latitude: number; longitude: number }, vibe: VibeInput): Promise<Spot[]> => {
      const key = cacheKey(coords.latitude, coords.longitude, vibe.intent, vibe.shoppingSubcategory);

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
            shoppingSubcategory: vibe.shoppingSubcategory || null,
          },
        });

        if (fnError) throw fnError;

        let spots: Spot[] = (data?.spots || []).map((s: any) => ({
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
          placeId: s.placeId,
          photoUrls: s.photoUrls || [],
        }));

        // Client-side safety net: validate against category rules
        spots = spots.filter(spot => isValidSpotForIntent(spot, vibe.intent));

        // ── Free-only guardrail ──
        if (shouldApplyFreeGuardrail(vibe)) {
          spots = applyFreeOnlyGuardrail(spots);
        }

        // ── Events category: exclude outdoor fillers unless price=FREE ──
        if (vibe.intent === 'events' && !vibe.filters.includes('cheap')) {
          spots = spots.filter(spot => {
            const types = normalizeTypes(spot);
            const nameLower = spot.name.toLowerCase();
            // Exclude parks/trails/nature from Events results
            const isOutdoorFiller = types.some(t =>
              ['park', 'trail', 'hiking', 'campground', 'natural_feature', 'nature'].includes(t)
            ) || ['trail', 'playground', 'nature area', 'scenic overlook'].some(kw => nameLower.includes(kw));
            return !isOutdoorFiller;
          });
        }

        // ── Free + Outdoor guardrail ──
        if (shouldApplyFreeOutdoorGuardrail(vibe)) {
          spots = applyFreeOutdoorGuardrail(spots);

          // If nothing survived, inject fallback free outdoor activities
          if (spots.length === 0) {
            spots = FREE_OUTDOOR_FALLBACKS.sort(() => Math.random() - 0.5).slice(0, 6);
          }
        }

        cache.set(key, spots);
        setIsLoading(false);
        return spots;
      } catch (err: any) {
        logger.error('Places search failed:', err);
        setError(err.message || 'Failed to search places');
        setIsLoading(false);
        return [];
      }
    },
    []
  );

  return { searchPlaces, isLoading, error };
}
