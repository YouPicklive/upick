import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SavedFortune {
  id: string;
  user_id: string;
  fortune_pack_id: string | null;
  fortune_text: string;
  context: Record<string, any>;
  created_at: string;
}

export function useSavedFortunes() {
  const { user, isAuthenticated } = useAuth();
  const [savedFortunes, setSavedFortunes] = useState<SavedFortune[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSavedFortunes([]);
      return;
    }

    const fetchFortunes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('saved_fortunes' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedFortunes((data as unknown as SavedFortune[]) || []);
      setLoading(false);
    };

    fetchFortunes();
  }, [isAuthenticated, user?.id]);

  const saveFortune = useCallback(async (fortuneText: string, packId?: string, context?: Record<string, any>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('saved_fortunes' as any)
      .insert({
        user_id: user.id,
        fortune_text: fortuneText,
        fortune_pack_id: packId || null,
        context: context || {},
      } as any)
      .select()
      .single();

    if (error) return { error: error.message };

    setSavedFortunes(prev => [(data as unknown as SavedFortune), ...prev]);
    return { error: null };
  }, [user?.id]);

  const deleteFortune = useCallback(async (fortuneId: string) => {
    if (!user) return;

    await supabase
      .from('saved_fortunes' as any)
      .delete()
      .eq('id', fortuneId)
      .eq('user_id', user.id);

    setSavedFortunes(prev => prev.filter(f => f.id !== fortuneId));
  }, [user?.id]);

  return { savedFortunes, loading, saveFortune, deleteFortune };
}
