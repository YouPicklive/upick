import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FortuneTier = 'free' | 'plus' | 'pack';
export type FortunePackKey = 'love' | 'career' | 'unhinged' | 'main_character';

export interface Fortune {
  id: string;
  tier: FortuneTier;
  pack_key: FortunePackKey | null;
  text: string;
  tags: string[];
}

export interface FortunePackInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tier: FortuneTier;
  packKey: FortunePackKey | null;
}

// Pack display info - maps DB keys to display data
export const FORTUNE_PACKS: FortunePackInfo[] = [
  { id: 'free', name: 'Classic', emoji: '🥠', description: 'Good vibes only', tier: 'free', packKey: null },
  { id: 'plus', name: 'Personalized', emoji: '✨', description: 'Plus exclusive', tier: 'plus', packKey: null },
  { id: 'love', name: 'Love', emoji: '💕', description: 'Romance predictions', tier: 'pack', packKey: 'love' },
  { id: 'career', name: 'Career', emoji: '💼', description: 'Success awaits', tier: 'pack', packKey: 'career' },
  { id: 'unhinged', name: 'Unhinged', emoji: '🤪', description: 'Chaotic energy', tier: 'pack', packKey: 'unhinged' },
  { id: 'main_character', name: 'Main Character', emoji: '👑', description: 'You\'re the star', tier: 'pack', packKey: 'main_character' },
];

export function useFortunes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a random fortune based on tier and pack
  const getRandomFortune = useCallback(async (
    tier: FortuneTier = 'free',
    packKey?: FortunePackKey
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('fortunes')
        .select('text')
        .eq('tier', tier)
        .eq('active', true);

      // If it's a pack tier, filter by pack_key
      if (tier === 'pack' && packKey) {
        query = query.eq('pack_key', packKey);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching fortune:', fetchError);
        setError(fetchError.message);
        return getFallbackFortune();
      }

      if (!data || data.length === 0) {
        console.warn('No fortunes found for tier:', tier, 'pack:', packKey);
        return getFallbackFortune();
      }

      // Return a random fortune from the results
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].text;
    } catch (err) {
      console.error('Error in getRandomFortune:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return getFallbackFortune();
    } finally {
      setLoading(false);
    }
  }, []);

  // Get fortune based on user selection (for UI compatibility)
  const getFortuneByPackId = useCallback(async (packId: string): Promise<string> => {
    const pack = FORTUNE_PACKS.find(p => p.id === packId);
    
    if (!pack) {
      return getRandomFortune('free');
    }

    return getRandomFortune(pack.tier, pack.packKey || undefined);
  }, [getRandomFortune]);

  // Get pack info by ID
  const getPackInfo = useCallback((packId: string): FortunePackInfo => {
    return FORTUNE_PACKS.find(p => p.id === packId) || FORTUNE_PACKS[0];
  }, []);

  return {
    loading,
    error,
    getRandomFortune,
    getFortuneByPackId,
    getPackInfo,
    FORTUNE_PACKS,
  };
}

// Fallback fortunes in case DB fetch fails
function getFallbackFortune(): string {
  const fallbacks = [
    "The universe has something special planned for you ✨",
    "Trust the pick — it knows what you need 🔮",
    "Good vibes are guaranteed at this spot 🌈",
    "Your next adventure is closer than you think 🌟",
    "Fortune favors the hungry — dig in! 🍴",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
