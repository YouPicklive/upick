import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeedPost {
  id: string;
  user_id: string | null;
  post_type: string;
  post_subtype: string | null;
  title: string;
  body: string | null;
  result_place_id: string | null;
  result_name: string;
  result_category: string | null;
  result_address: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  city_id: string | null;
  region: string | null;
  is_anonymous: boolean;
  is_bot: boolean;
  visibility: string;
  created_at: string;
  expires_at: string | null;
  bot_display_name: string | null;
  bot_avatar_url: string | null;
  metadata: Record<string, any> | null;
  // Joined from profiles
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  liked_by_me: boolean;
}

export type FeedTab = 'today' | 'trending' | 'new';

interface UseFeedOptions {
  cityId?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number;
  postType?: string;
  tab?: FeedTab;
}

export function useFeed(options: UseFeedOptions = {}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feed_posts' as any)
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (options.postType) {
        query = query.eq('post_type', options.postType);
      }

      // Filter by city_id (preferred) or city name
      if (options.cityId) {
        query = query.eq('city_id', options.cityId);
      } else if (options.city) {
        query = query.eq('city', options.city);
      }

      // Tab-specific filters
      if (options.tab === 'today') {
        const now = new Date();
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        // Show events starting today + daily prompts
        query = query.gte('created_at', dayStart.toISOString());
      }

      // Filter out expired posts
      const now = new Date().toISOString();
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);

      const { data: postsData, error } = await query;
      if (error || !postsData) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs (skip nulls for anonymous posts)
      const userIds = [...new Set((postsData as any[]).map((p: any) => p.user_id).filter(Boolean))];

      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);
        profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));
      }

      // Get like counts from post_likes
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

      // Filter by radius if coordinates provided (and no city filter)
      let filtered = postsData as any[];
      if (!options.cityId && !options.city && options.latitude && options.longitude && options.radiusMiles) {
        filtered = filtered.filter((p: any) => {
          if (!p.lat || !p.lng) return true;
          const dist = haversine(options.latitude!, options.longitude!, p.lat, p.lng);
          return dist <= options.radiusMiles!;
        });
      }

      let enriched: FeedPost[] = filtered.map((p: any) => {
        const profile = p.user_id ? profileMap.get(p.user_id) : null;
        return {
          ...p,
          post_subtype: p.post_subtype || null,
          city_id: p.city_id || null,
          expires_at: p.expires_at || null,
          metadata: p.metadata || null,
          bot_display_name: p.bot_display_name || null,
          bot_avatar_url: p.bot_avatar_url || null,
          username: profile?.username || null,
          display_name: p.is_bot && p.bot_display_name ? p.bot_display_name : (p.is_anonymous ? null : (profile?.display_name || null)),
          avatar_url: p.is_bot && p.bot_avatar_url ? p.bot_avatar_url : (p.is_anonymous ? null : (profile?.avatar_url || null)),
          like_count: likeCountMap.get(p.id) || 0,
          liked_by_me: myLikes.has(p.id),
        };
      });

      // Tab-specific sorting
      if (options.tab === 'trending') {
        enriched.sort((a, b) => b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setPosts(enriched);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [options.cityId, options.city, options.postType, options.tab, options.latitude, options.longitude, options.radiusMiles, user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription on feed_posts
  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, () => {
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

  return { posts, loading, refresh: fetchPosts, toggleLike };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
