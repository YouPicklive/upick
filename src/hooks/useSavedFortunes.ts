import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SavedCardDraw {
  id: string;
  user_id: string;
  deck_id: string;
  card_id: string;
  card_name: string;
  action_text: string;
  vibe_tag: string | null;
  category: string | null;
  spin_id: string | null;
  created_at: string;
}

export function useSavedFortunes() {
  const { user, isAuthenticated } = useAuth();
  const [savedCards, setSavedCards] = useState<SavedCardDraw[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSavedCards([]);
      return;
    }

    const fetchCards = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('saved_card_draws')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedCards((data as SavedCardDraw[]) || []);
      setLoading(false);
    };

    fetchCards();
  }, [isAuthenticated, user?.id]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!user) return;

    await supabase
      .from('saved_card_draws')
      .delete()
      .eq('id', cardId)
      .eq('user_id', user.id);

    setSavedCards(prev => prev.filter(c => c.id !== cardId));
  }, [user?.id]);

  // Keep old names for backward compat
  return { savedFortunes: savedCards, savedCards, loading, deleteFortune: deleteCard, deleteCard };
}
