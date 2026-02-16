import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PlaceReview {
  id: string;
  user_id: string;
  place_name: string;
  place_id: string | null;
  rating: number;
  content: string | null;
  note: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function usePlaceReviews(profileUserId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = profileUserId || user?.id;

  const fetchReviews = useCallback(async () => {
    if (!targetUserId) { setReviews([]); setLoading(false); return; }
    const { data } = await supabase
      .from('place_reviews' as any)
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    setReviews((data as any[] || []) as PlaceReview[]);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const addReview = useCallback(async (review: {
    place_name: string;
    place_id?: string | null;
    rating: number;
    content?: string | null;
    note?: string | null;
    is_public?: boolean;
  }) => {
    if (!user) { toast.error('Sign in to leave a review'); return false; }

    const { error } = await supabase.from('place_reviews' as any).insert({
      user_id: user.id,
      place_name: review.place_name,
      place_id: review.place_id || null,
      rating: review.rating,
      content: review.content || null,
      note: review.note || null,
      is_public: review.is_public ?? true,
    } as any);

    if (error) {
      toast.error('Failed to save review');
      return false;
    }

    toast.success('Review saved! ⭐');
    await fetchReviews();
    return true;
  }, [user, fetchReviews]);

  const updateReview = useCallback(async (reviewId: string, updates: Partial<Pick<PlaceReview, 'rating' | 'content' | 'note' | 'is_public'>>) => {
    if (!user) return false;
    const { error } = await supabase
      .from('place_reviews' as any)
      .update(updates as any)
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) { toast.error('Failed to update review'); return false; }
    await fetchReviews();
    return true;
  }, [user, fetchReviews]);

  const deleteReview = useCallback(async (reviewId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('place_reviews' as any)
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) { toast.error('Failed to delete'); return false; }
    toast('Review removed');
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    return true;
  }, [user]);

  return { reviews, loading, addReview, updateReview, deleteReview };
}
