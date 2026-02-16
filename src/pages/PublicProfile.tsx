import { useParams } from 'react-router-dom';
import { usePublicProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Button } from '@/components/ui/button';
import { User, Settings, Loader2, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { profile, loading } = usePublicProfile(username);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [stats, setStats] = useState({ postCount: 0, likesReceived: 0 });

  const isOwner = isAuthenticated && user && profile && user.id === profile.id;

  useEffect(() => {
    if (!profile?.id) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      // Fetch user's public feed_posts
      const { data: feedPosts } = await supabase
        .from('feed_posts' as any)
        .select('*')
        .eq('user_id', profile.id)
        .eq('visibility', 'public')
        .eq('is_anonymous', false)
        .order('created_at', { ascending: false })
        .limit(30);

      setPosts((feedPosts as any[]) || []);

      // Count posts
      const postCount = (feedPosts as any[])?.length || 0;

      // Count likes received on this user's posts
      const postIds = ((feedPosts as any[]) || []).map((p: any) => p.id);
      let likesReceived = 0;
      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes' as any)
          .select('id')
          .in('post_id', postIds);
        likesReceived = (likes as any[])?.length || 0;
      }

      setStats({ postCount, likesReceived });
      setPostsLoading(false);
    };

    fetchPosts();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="text-center py-20">
          <User className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold mb-1">User not found</h2>
          <p className="text-sm text-muted-foreground">@{username} doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-border/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="font-display text-xl font-bold">{profile.display_name || profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-foreground/80 mt-2 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>
          )}
          {(profile.city || profile.region) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {[profile.city, profile.region].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-display text-lg font-bold">{stats.postCount}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold">{stats.likesReceived}</p>
              <p className="text-[11px] text-muted-foreground">Likes</p>
            </div>
          </div>

          {isOwner && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/settings')}>
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Posts list */}
        <div>
          <h2 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Activity</h2>
          {postsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <div key={post.id} className="bg-card rounded-xl border border-border/50 p-4">
                  <p className="text-sm font-semibold text-foreground">{post.title}</p>
                  {post.result_name && post.result_name !== post.title && (
                    <p className="text-xs text-muted-foreground mt-1">📍 {post.result_name}</p>
                  )}
                  {post.body && (
                    <p className="text-sm text-foreground/70 mt-1">{post.body}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
