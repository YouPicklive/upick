import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAlignmentStreak() {
  const { user, isAuthenticated } = useAuth();
  const [streak, setStreak] = useState(0);
  const [experiencesCount, setExperiencesCount] = useState(0);

  // Fetch current streak & experience count from profile
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    supabase
      .from('profiles')
      .select('alignment_streak_count, experiences_completed_count')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setStreak((data as any).alignment_streak_count ?? 0);
          setExperiencesCount((data as any).experiences_completed_count ?? 0);
        }
      });
  }, [isAuthenticated, user?.id]);

  const updateStreak = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const { data } = await supabase.rpc('update_alignment_streak' as any, { p_user_id: user.id });
      if (data && (data as any).success) {
        setStreak((data as any).streak);
      }
    } catch {
      // non-critical
    }
  }, [isAuthenticated, user?.id]);

  const markExperienceTried = useCallback(async (): Promise<number | null> => {
    if (!isAuthenticated || !user) return null;
    try {
      const { data } = await supabase.rpc('mark_experience_tried' as any, { p_user_id: user.id });
      if (data && (data as any).success) {
        const count = (data as any).count as number;
        setExperiencesCount(count);
        return count;
      }
    } catch {
      // non-critical
    }
    return null;
  }, [isAuthenticated, user?.id]);

  return { streak, experiencesCount, updateStreak, markExperienceTried };
}
