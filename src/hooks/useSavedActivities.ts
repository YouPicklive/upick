import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SavedActivity {
  id: string;
  created_at: string;
  user_id: string;
  activity_type: string;
  title: string;
  venue: string | null;
  description: string | null;
  category: string | null;
  event_date: string | null;
  event_time: string | null;
  source_url: string | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  feed_post_id: string | null;
}

export function useSavedActivities(profileUserId?: string) {
  const { user } = useAuth();
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const targetUserId = profileUserId || user?.id;

  const makeKey = (activityType: string, title: string, venue?: string | null) =>
    `${activityType}|${title}|${venue || ''}`;

  const fetchSaved = useCallback(async () => {
    if (!targetUserId) { setSavedActivities([]); setLoading(false); return; }
    const { data } = await supabase
      .from('saved_activities' as any)
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    const items = (data as any[] || []) as SavedActivity[];
    setSavedActivities(items);
    setSavedKeys(new Set(items.map(a => makeKey(a.activity_type, a.title, a.venue))));
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const isSaved = useCallback((activityType: string, title: string, venue?: string | null) => {
    return savedKeys.has(makeKey(activityType, title, venue));
  }, [savedKeys]);

  const saveActivity = useCallback(async (activity: Omit<SavedActivity, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) { toast.error('Sign in to save activities'); return false; }

    const { error } = await supabase.from('saved_activities' as any).insert({
      ...activity,
      user_id: user.id,
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast('Already saved!', { description: 'This is in your saved activities.' });
      } else {
        toast.error('Failed to save');
      }
      return false;
    }

    toast.success('Saved to your profile! ✨');
    await fetchSaved();
    return true;
  }, [user, fetchSaved]);

  const unsaveActivity = useCallback(async (activityType: string, title: string, venue?: string | null) => {
    if (!user) return false;

    let query = supabase
      .from('saved_activities' as any)
      .delete()
      .eq('user_id', user.id)
      .eq('activity_type', activityType)
      .eq('title', title);

    if (venue) {
      query = query.eq('venue', venue);
    } else {
      query = query.is('venue', null);
    }

    const { error } = await query;
    if (error) { toast.error('Failed to remove'); return false; }

    toast('Removed from saved');
    await fetchSaved();
    return true;
  }, [user, fetchSaved]);

  return { savedActivities, loading, isSaved, saveActivity, unsaveActivity };
}
