import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SavedSpin {
  id: string;
  user_id: string;
  place_name: string;
  place_id: string | null;
  category: string | null;
  fortune_text: string | null;
  fortune_pack: string | null;
  photo_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  created_at: string;
}

export function useSavedSpins(profileUserId?: string) {
  const { user } = useAuth();
  const [savedSpins, setSavedSpins] = useState<SavedSpin[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = profileUserId || user?.id;

  const fetchSavedSpins = useCallback(async () => {
    if (!targetUserId) { setSavedSpins([]); setLoading(false); return; }
    const { data } = await supabase
      .from('saved_spins' as any)
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    setSavedSpins((data as any[] || []) as SavedSpin[]);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { fetchSavedSpins(); }, [fetchSavedSpins]);

  const saveSpin = useCallback(async (spin: Omit<SavedSpin, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) { toast.error('Sign in to save spins'); return false; }

    const { error } = await supabase.from('saved_spins' as any).insert({
      ...spin,
      user_id: user.id,
    } as any);

    if (error) {
      toast.error('Failed to save spin');
      return false;
    }

    toast.success('Spin moment saved! ✨');
    await fetchSavedSpins();
    return true;
  }, [user, fetchSavedSpins]);

  const updateNote = useCallback(async (spinId: string, note: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('saved_spins' as any)
      .update({ note } as any)
      .eq('id', spinId)
      .eq('user_id', user.id);

    if (error) { toast.error('Failed to update note'); return false; }
    await fetchSavedSpins();
    return true;
  }, [user, fetchSavedSpins]);

  const deleteSpin = useCallback(async (spinId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('saved_spins' as any)
      .delete()
      .eq('id', spinId)
      .eq('user_id', user.id);

    if (error) { toast.error('Failed to delete'); return false; }
    toast('Removed from saved spins');
    setSavedSpins(prev => prev.filter(s => s.id !== spinId));
    return true;
  }, [user]);

  return { savedSpins, loading, saveSpin, updateNote, deleteSpin };
}
