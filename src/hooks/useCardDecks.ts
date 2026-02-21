import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface CardDeck {
  id: string;
  name: string;
  description: string | null;
  tier: 'free' | 'plus' | 'paid';
  price_cents: number | null;
  is_active: boolean;
}

export function useCardDecks() {
  const [decks, setDecks] = useState<CardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_decks')
        .select('id, name, description, tier, price_cents, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching card decks:', error);
        setDecks([]);
      } else {
        setDecks((data as CardDeck[]) || []);
      }
    } catch (err) {
      logger.error('Error in useCardDecks:', err);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return { decks, loading, refetch: fetchDecks };
}
