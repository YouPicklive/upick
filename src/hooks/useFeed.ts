import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeedPost {
  id: string;
  user_id: string;
  type: string;
  content: string | null;
  place_name: string | null;
  place_id: string | null;
  place_category: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  event_starts_at: string | null;
  event_ends_at: string | null;
  created_at: string;
  // Joined
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  liked_by_me: boolean;
}

interface UseFeedOptions {
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number;
  type?: string;
}

export function useFeed(options: UseFeedOptions = {}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts with profile join
      let query = supabase
        .from('posts' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.city) {
        query = query.eq('city', options.city);
      }

      const { data: postsData, error } = await query;
      if (error || !postsData) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set((postsData as any[]).map((p: any) => p.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles' as any)
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));

      // Get like counts
      const postIds = (postsData as any[]).map((p: any) => p.id);
      const { data: likes } = await supabase
        .from('post_likes' as any)
        .select('post_id, user_id')
        .in('post_id', postIds);

      const likeCountMap = new Map<string, number>();
      const myLikes = new Set<string>();
      (likes as any[] || []).forEach((l: any) => {
        likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
        if (user && l.user_id === user.id) myLikes.add(l.post_id);
      });

      // Filter by radius if coordinates provided
      let filtered = postsData as any[];
      if (options.latitude && options.longitude && options.radiusMiles) {
        filtered = filtered.filter((p: any) => {
          if (!p.latitude || !p.longitude) return true; // Include posts without coords
          const dist = haversine(options.latitude!, options.longitude!, p.latitude, p.longitude);
          return dist <= options.radiusMiles!;
        });
      }

      const enriched: FeedPost[] = filtered.map((p: any) => {
        const profile = profileMap.get(p.user_id);
        return {
          ...p,
          username: profile?.username || null,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          like_count: likeCountMap.get(p.id) || 0,
          liked_by_me: myLikes.has(p.id),
        };
      });

      setPosts(enriched);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [options.city, options.type, options.latitude, options.longitude, options.radiusMiles, user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase.from('post_likes' as any).delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes' as any).insert({ post_id: postId, user_id: user.id } as any);
    }

    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1 }
        : p
    ));
  }, [user, posts]);

  const createPost = useCallback(async (post: {
    type: string;
    content?: string;
    place_name?: string;
    place_id?: string;
    place_category?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    event_starts_at?: string;
    event_ends_at?: string;
  }) => {
    if (!user) return;
    await supabase.from('posts' as any).insert({
      user_id: user.id,
      ...post,
    } as any);
  }, [user]);

  return { posts, loading, refresh: fetchPosts, toggleLike, createPost };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
