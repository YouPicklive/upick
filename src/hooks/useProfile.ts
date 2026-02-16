import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setProfile(data as unknown as Profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user?.id]);

  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url'>>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error: updateError } = await supabase
      .from('profiles' as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', user.id);

    if (updateError) return { error: updateError.message };

    setProfile(prev => prev ? { ...prev, ...updates } : null);
    return { error: null };
  }, [user?.id]);

  return { profile, loading, error, updateProfile };
}
