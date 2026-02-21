import { useState, useCallback } from 'react';
import { GameState, Spot, SAMPLE_SPOTS, Preferences, VibeInput, VibeIntent, VibeEnergy, VibeFilter, intentToCategories, computeRandomness, YouPickVibe } from '@/types/game';
import { getMicroAdventures } from '@/data/microAdventures';
import { applyFreeOutdoorGuardrail, shouldApplyFreeOutdoorGuardrail, FREE_OUTDOOR_FALLBACKS, shouldApplyFreeGuardrail, applyFreeOnlyGuardrail, FREE_GENERAL_FALLBACKS } from '@/hooks/usePlacesSearch';
import { applyArchetypeRanking, ArchetypeKey } from '@/components/game/PickACard'; // kept for ranking logic

const initialPreferences: Preferences = {
  location: 'both',
  smoking: 'doesnt-matter',
  vibe: 'both',
  fancy: 'both',
  distance: 'any',
  mood: 'any',
  budget: 'any',
  fortunePack: 'fools_journey',
  freeOnly: false,
};

const initialVibeInput: VibeInput = {
  intent: null,
  energy: null,
  filters: ['open-now', 'city-wide'] as any, // Default: 10 mi (free-tier friendly)
  shoppingSubcategory: null,
  selectedVibe: null,
  archetypeKey: null,
};

const initialState: GameState = {
  mode: 'landing',
  vibeStep: 0,
  vibeInput: initialVibeInput,
  playerCount: 1,
  currentPlayer: 1,
  spots: [],
  remainingSpots: [],
  votes: {},
  likedSpots: [],
  winner: null,
  category: 'all',
  preferences: initialPreferences,
};

// Session-level dislike tracking (clears on refresh)
const sessionDislikes = new Set<string>();

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const setMode = useCallback((mode: GameState['mode']) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setVibeStep = useCallback((step: 0 | 1 | 2) => {
    setState((prev) => ({ ...prev, vibeStep: step }));
  }, []);

  const setVibeInput = useCallback((input: Partial<VibeInput>) => {
    setState((prev) => ({
      ...prev,
      vibeInput: { ...prev.vibeInput, ...input },
    }));
  }, []);

  const setPlayerCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, playerCount: count }));
  }, []);

  const setCategory = useCallback((category: GameState['category']) => {
    setState((prev) => ({ ...prev, category }));
  }, []);

  const setPreferences = useCallback((preferences: Partial<Preferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    }));
  }, []);

  const filterSpotsByPreferences = useCallback((spots: Spot[], prefs: Preferences): Spot[] => {
    return spots.filter((spot) => {
      // Exclude session-disliked items
      if (sessionDislikes.has(spot.id)) return false;
      if (prefs.freeOnly) {
        const isTrulyFree = spot.tags?.includes('Free');
        if (!isTrulyFree) return false;
      }
      if (prefs.location === 'indoor' && spot.isOutdoor) return false;
      if (prefs.location === 'outdoor' && !spot.isOutdoor) return false;
      if (prefs.smoking === 'yes' && !spot.smokingFriendly) return false;
      if (prefs.smoking === 'no' && spot.smokingFriendly) return false;
      if (prefs.fancy === 'fancy' && spot.priceLevel < 3) return false;
      if (prefs.fancy === 'divey' && spot.priceLevel > 2) return false;
      if (prefs.vibe === 'chill' && (spot.vibeLevel === 'active' || spot.vibeLevel === 'dancing')) return false;
      if (prefs.vibe === 'active' && spot.vibeLevel === 'chill') return false;
      if (prefs.vibe === 'dancing') {
        const hasDancingTags = spot.tags?.some(tag => 
          ['Dancing', 'DJ', 'Dance Floor', 'Events'].includes(tag)
        );
        const isDancingVibe = spot.vibeLevel === 'dancing';
        if (!hasDancingTags && !isDancingVibe) return false;
      }
      if (prefs.vibe === 'lazy' && (spot.vibeLevel === 'active' || spot.vibeLevel === 'dancing')) return false;
      return true;
    });
  }, []);

  // Filter spots using the Quick Vibe input
  const filterSpotsByVibe = useCallback((vibe: VibeInput): Spot[] => {
    let spots = [...SAMPLE_SPOTS].filter(s => !s.plusOnly && !sessionDislikes.has(s.id));
    const randomness = computeRandomness(vibe);

    // Filter by intent (maps to categories)
    if (vibe.intent && vibe.intent !== 'surprise') {
      const categories = intentToCategories(vibe.intent);
      if (categories.length > 0) {
        spots = spots.filter(s => categories.includes(s.category));
      }
    }

    // Filter by energy
    if (vibe.energy) {
      spots = spots.filter(spot => {
        switch (vibe.energy) {
          case 'chill': return spot.vibeLevel === 'chill' || spot.vibeLevel === 'lazy';
          case 'social': return spot.vibeLevel === 'moderate' || spot.vibeLevel === 'active';
          case 'romantic': return spot.vibeLevel === 'chill' || spot.vibeLevel === 'moderate';
          case 'adventure': return spot.vibeLevel === 'active' || spot.vibeLevel === 'dancing';
          case 'productive': return spot.vibeLevel === 'chill';
          case 'self-care': return spot.vibeLevel === 'chill' || spot.vibeLevel === 'lazy';
          case 'weird': return true;
          default: return true;
        }
      });
    }

    // Apply optional filters
    for (const filter of vibe.filters) {
      switch (filter) {
        case 'cheap': spots = spots.filter(s => s.priceLevel === 1); break;
        case 'mid': spots = spots.filter(s => s.priceLevel === 2); break;
        case 'treat': spots = spots.filter(s => s.priceLevel >= 3); break;
      }
    }

    // If too few results, relax and use broader set
    if (spots.length < 4) {
      if (vibe.intent && vibe.intent !== 'surprise') {
        const categories = intentToCategories(vibe.intent);
        spots = categories.length > 0 
          ? SAMPLE_SPOTS.filter(s => categories.includes(s.category) && !sessionDislikes.has(s.id))
          : [...SAMPLE_SPOTS].filter(s => !sessionDislikes.has(s.id));
      } else {
        spots = [...SAMPLE_SPOTS].filter(s => !sessionDislikes.has(s.id));
      }
    }

    // Add extra randomization for "wild" mode
    if (randomness === 'wild') {
      spots = [...SAMPLE_SPOTS].filter(s => !s.plusOnly && !sessionDislikes.has(s.id));
    }

    return spots;
  }, []);

  /**
   * Blend micro adventures into the pool based on budget
   */
  const blendMicroAdventures = useCallback((externalSpots: Spot[], budget: string, category: string, vibe?: YouPickVibe | null): Spot[] => {
    const isFreeOrBudget = budget === 'budget' || budget === 'any';
    const isActivities = category === 'all' || category === 'activity';
    
    if (!isFreeOrBudget) {
      // Mid/Splurge: 90% Google, 10% micro (optional)
      if (externalSpots.length >= 6) return externalSpots;
      // Only inject if pool is too small
      const micros = getMicroAdventures(vibe, 2);
      return [...externalSpots, ...micros].slice(0, 10);
    }
    
    const micros = getMicroAdventures(vibe, isActivities ? 7 : 3);
    
    if (isActivities) {
      // Activities: 70% micro, 30% Google
      const microCount = Math.max(4, Math.round(10 * 0.7));
      const googleCount = 10 - microCount;
      const pool = [
        ...micros.slice(0, microCount),
        ...externalSpots.slice(0, googleCount),
      ];
      return pool.sort(() => Math.random() - 0.5).slice(0, 10);
    } else {
      // Other: 20% micro, 80% Google
      const microCount = Math.max(1, Math.round(10 * 0.2));
      const googleCount = 10 - microCount;
      const pool = [
        ...micros.slice(0, microCount),
        ...externalSpots.slice(0, googleCount),
      ];
      return pool.sort(() => Math.random() - 0.5).slice(0, 10);
    }
  }, []);

  const startGame = useCallback((externalSpots?: Spot[]) => {
    let filteredSpots: Spot[];

    if (externalSpots && externalSpots.length >= 4) {
      // Filter out session dislikes — use only real location-based results
      filteredSpots = externalSpots.filter(s => !sessionDislikes.has(s.id));
    } else {
      const hasVibeInput = state.vibeInput.intent || state.vibeInput.energy || state.vibeInput.filters.length > 0;

      if (hasVibeInput) {
        filteredSpots = filterSpotsByVibe(state.vibeInput);
      } else {
        filteredSpots = state.category === 'all' 
          ? SAMPLE_SPOTS.filter(s => !sessionDislikes.has(s.id))
          : SAMPLE_SPOTS.filter((spot) => spot.category === state.category && !sessionDislikes.has(spot.id));
        filteredSpots = filterSpotsByPreferences(filteredSpots, state.preferences);
        
        if (filteredSpots.length < 4) {
          filteredSpots = state.category === 'all' 
            ? SAMPLE_SPOTS.filter(s => !sessionDislikes.has(s.id))
            : SAMPLE_SPOTS.filter((spot) => spot.category === state.category && !sessionDislikes.has(spot.id));
          filteredSpots = filteredSpots.filter((spot) => {
            if (state.preferences.location === 'indoor' && spot.isOutdoor) return false;
            if (state.preferences.location === 'outdoor' && !spot.isOutdoor) return false;
            return true;
          });
        }
        if (filteredSpots.length < 4) {
          filteredSpots = state.category === 'all' 
            ? SAMPLE_SPOTS.filter(s => !sessionDislikes.has(s.id))
            : SAMPLE_SPOTS.filter((spot) => spot.category === state.category && !sessionDislikes.has(spot.id));
        }
      }

      // Note: no micro-adventure injection — all results should be real places
    }

    // ── Free-only guardrail (applies to ALL spot sources) ──
    if (shouldApplyFreeGuardrail(state.vibeInput)) {
      filteredSpots = applyFreeOnlyGuardrail(filteredSpots);

      // Add "100% Free" tag to all surviving spots
      filteredSpots = filteredSpots.map(s => ({
        ...s,
        tags: s.tags.some(t => t === '100% Free') ? s.tags : ['100% Free', ...s.tags],
      }));
    }

    // ── Free + Outdoor guardrail (stricter, applies on top) ──
    if (shouldApplyFreeOutdoorGuardrail(state.vibeInput)) {
      filteredSpots = applyFreeOutdoorGuardrail(filteredSpots);
      if (filteredSpots.length < 3) {
        const fallbacks = FREE_OUTDOOR_FALLBACKS
          .filter(f => !filteredSpots.some(s => s.id === f.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 6 - filteredSpots.length);
        filteredSpots = [...filteredSpots, ...fallbacks];
      }
    }

    // ── General free fallback (non-outdoor) ──
    if (shouldApplyFreeGuardrail(state.vibeInput) && !shouldApplyFreeOutdoorGuardrail(state.vibeInput) && filteredSpots.length < 3) {
      const fallbacks = FREE_GENERAL_FALLBACKS
        .filter(f => !filteredSpots.some(s => s.id === f.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 6 - filteredSpots.length);
      filteredSpots = [...filteredSpots, ...fallbacks];
    }

    // Apply archetype ranking if set (kept for future use)
    if (state.vibeInput.archetypeKey) {
      filteredSpots = applyArchetypeRanking(filteredSpots, state.vibeInput.archetypeKey as ArchetypeKey);
    }

    const shuffled = [...filteredSpots].sort(() => Math.random() - 0.5).slice(0, 10);
    
    setState((prev) => ({
      ...prev,
      mode: 'playing',
      spots: shuffled,
      remainingSpots: shuffled,
      votes: shuffled.reduce((acc, spot) => ({ ...acc, [spot.id]: 0 }), {}),
      likedSpots: [],
      currentPlayer: 1,
      winner: null,
    }));
  }, [state.category, state.preferences, state.vibeInput, filterSpotsByPreferences, filterSpotsByVibe]);

  const vote = useCallback((spotId: string, liked: boolean) => {
    setState((prev) => {
      const newVotes = { ...prev.votes };
      let newLikedSpots = [...prev.likedSpots];
      
      if (liked) {
        newVotes[spotId] = (newVotes[spotId] || 0) + 1;
        const likedSpot = prev.spots.find(s => s.id === spotId);
        if (likedSpot && !newLikedSpots.find(s => s.id === spotId)) {
          newLikedSpots.push(likedSpot);
        }
      }

      const newRemainingSpots = prev.remainingSpots.slice(1);
      const isRoundComplete = newRemainingSpots.length === 0;
      
      if (isRoundComplete) {
        const maxVotes = Math.max(...Object.values(newVotes));
        const topSpots = prev.spots.filter((spot) => newVotes[spot.id] === maxVotes);
        
        if (topSpots.length === 1 || prev.currentPlayer >= prev.playerCount) {
          return {
            ...prev,
            votes: newVotes,
            likedSpots: newLikedSpots,
            remainingSpots: [],
            mode: 'results',
            winner: topSpots[Math.floor(Math.random() * topSpots.length)],
          };
        } else {
          return {
            ...prev,
            votes: Object.fromEntries(topSpots.map((s) => [s.id, 0])),
            likedSpots: newLikedSpots,
            remainingSpots: [...topSpots].sort(() => Math.random() - 0.5),
            spots: topSpots,
            currentPlayer: prev.currentPlayer + 1,
          };
        }
      }

      return {
        ...prev,
        votes: newVotes,
        likedSpots: newLikedSpots,
        remainingSpots: newRemainingSpots,
      };
    });
  }, []);

  // Dislike a spot — add to session dislikes, never show again this session
  const dislikeSpot = useCallback((spotId: string) => {
    sessionDislikes.add(spotId);
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const currentSpot = state.remainingSpots[0] || null;
  const progress = state.spots.length > 0 
    ? ((state.spots.length - state.remainingSpots.length) / state.spots.length) * 100 
    : 0;

  return {
    state,
    currentSpot,
    progress,
    setMode,
    setVibeStep,
    setVibeInput,
    setPlayerCount,
    setCategory,
    setPreferences,
    startGame,
    vote,
    dislikeSpot,
    resetGame,
  };
}
