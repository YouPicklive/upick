import { useState, useCallback } from 'react';
import { GameState, Spot, SAMPLE_SPOTS, Preferences, VibeInput, VibeIntent, VibeEnergy, VibeFilter, intentToCategories, computeRandomness } from '@/types/game';

const initialPreferences: Preferences = {
  location: 'both',
  smoking: 'doesnt-matter',
  vibe: 'both',
  fancy: 'both',
  distance: 'any',
  mood: 'any',
  budget: 'any',
  fortunePack: 'free',
  freeOnly: false,
};

const initialVibeInput: VibeInput = {
  intent: null,
  energy: null,
  filters: [],
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
    let spots = [...SAMPLE_SPOTS].filter(s => !s.plusOnly || vibe.intent === 'event-planning' || vibe.intent === 'corporate');
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
          case 'weird': return true; // everything goes
          default: return true;
        }
      });
    }

    // Apply optional filters
    for (const filter of vibe.filters) {
      switch (filter) {
        case 'cheap': spots = spots.filter(s => s.priceLevel <= 2); break;
        case 'mid': spots = spots.filter(s => s.priceLevel >= 2 && s.priceLevel <= 3); break;
        case 'treat': spots = spots.filter(s => s.priceLevel >= 3); break;
        case 'indoor': spots = spots.filter(s => !s.isOutdoor); break;
        case 'outdoor': spots = spots.filter(s => s.isOutdoor); break;
        // near-me and any-distance are handled later with geolocation
      }
    }

    // If too few results, relax and use broader set
    if (spots.length < 4) {
      if (vibe.intent && vibe.intent !== 'surprise') {
        const categories = intentToCategories(vibe.intent);
        spots = categories.length > 0 
          ? SAMPLE_SPOTS.filter(s => categories.includes(s.category))
          : [...SAMPLE_SPOTS];
      } else {
        spots = [...SAMPLE_SPOTS];
      }
    }

    // Add extra randomization for "wild" mode
    if (randomness === 'wild') {
      spots = [...SAMPLE_SPOTS].filter(s => !s.plusOnly);
    }

    return spots;
  }, []);

  const startGame = useCallback((externalSpots?: Spot[]) => {
    let filteredSpots: Spot[];

    if (externalSpots && externalSpots.length >= 4) {
      // Use real places from Google Places API
      filteredSpots = externalSpots;
    } else {
      // Fallback: use sample spots with vibe/preference filtering
      const hasVibeInput = state.vibeInput.intent || state.vibeInput.energy || state.vibeInput.filters.length > 0;

      if (hasVibeInput) {
        filteredSpots = filterSpotsByVibe(state.vibeInput);
      } else {
        filteredSpots = state.category === 'all' 
          ? SAMPLE_SPOTS 
          : SAMPLE_SPOTS.filter((spot) => spot.category === state.category);
        filteredSpots = filterSpotsByPreferences(filteredSpots, state.preferences);
        
        if (filteredSpots.length < 4) {
          filteredSpots = state.category === 'all' 
            ? SAMPLE_SPOTS 
            : SAMPLE_SPOTS.filter((spot) => spot.category === state.category);
          filteredSpots = filteredSpots.filter((spot) => {
            if (state.preferences.location === 'indoor' && spot.isOutdoor) return false;
            if (state.preferences.location === 'outdoor' && !spot.isOutdoor) return false;
            return true;
          });
        }
        if (filteredSpots.length < 4) {
          filteredSpots = state.category === 'all' 
            ? SAMPLE_SPOTS 
            : SAMPLE_SPOTS.filter((spot) => spot.category === state.category);
        }
      }
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
    resetGame,
  };
}
