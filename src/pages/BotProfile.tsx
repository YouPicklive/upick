import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MapPin, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface BotPost {
  id: string;
  title: string;
  body: string | null;
  result_name: string;
  result_category: string | null;
  city: string | null;
  created_at: string;
  bot_avatar_url: string | null;
}

export default function BotProfile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BotPost[]>([]);
  const [loading, setLoading] = useState(true);

  const displayHandle = handle?.startsWith('@') ? handle : `@${handle}`;

  useEffect(() => {
    async function fetchBotPosts() {
      setLoading(true);
      const { data } = await supabase
        .from('feed_posts' as any)
        .select('id, title, body, result_name, result_category, city, created_at, bot_avatar_url')
        .eq('is_bot', true)
        .eq('bot_display_name', displayHandle)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      setPosts((data as any[] as BotPost[]) || []);
      setLoading(false);
    }
    if (handle) fetchBotPosts();
  }, [handle, displayHandle]);

  const avatarUrl = posts[0]?.bot_avatar_url || null;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary border border-border/50 overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayHandle} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {displayHandle[1]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{displayHandle}</h1>
            <p className="text-sm text-muted-foreground">
              {posts.length} discovery {posts.length === 1 ? 'post' : 'posts'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">YouPick Explorer</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No posts found for this explorer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-card rounded-xl border border-border/50 p-4">
                {post.result_name && (
                  <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-foreground">{post.result_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.result_category && (
                        <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                          {post.result_category}
                        </span>
                      )}
                      {post.city && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {post.city}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {post.body && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-2">{post.body}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
