import { useState, useEffect, useCallback } from 'react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useFeed, FeedPost } from '@/hooks/useFeed';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useSavedActivities } from '@/hooks/useSavedActivities';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MapPin, Loader2, Sparkles, Share2, ExternalLink, Bookmark, BookmarkCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { SharePostModal } from '@/components/game/SharePostModal';
import { toast } from 'sonner';

function PostTypeLabel({ type }: { type: string }) {
  const labels: Record<string, { text: string; emoji: string }> = {
    spin_result: { text: 'spun fate', emoji: '🎡' },
    save: { text: 'saved a spot', emoji: '📌' },
    review: { text: 'shared a review', emoji: '✍️' },
    bot: { text: 'discovered', emoji: '🤖' },
    business_event: { text: 'posted an event', emoji: '📅' },
  };
  const label = labels[type] || { text: type, emoji: '📝' };
  return (
    <span className="text-xs text-muted-foreground">
      {label.emoji} {label.text}
    </span>
  );
}

function FeedCard({ post, onLike, isAuthenticated, isPremium, isSaved, onSave, onUnsave, onUpgrade }: {
  post: FeedPost;
  onLike: (id: string) => void;
  isAuthenticated: boolean;
  isPremium: boolean;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onUpgrade: () => void;
}) {
  const displayName = post.is_bot && post.bot_display_name ? post.bot_display_name : (post.is_anonymous ? 'Someone' : (post.display_name || post.username || 'Someone'));
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const handleSaveClick = () => {
    if (!isAuthenticated) { toast('Sign in to save activities'); return; }
    if (!isPremium) { onUpgrade(); return; }
    if (isSaved) onUnsave(); else onSave();
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 transition-shadow hover:shadow-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
          {!post.is_anonymous && post.avatar_url ? (
            <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {post.is_bot && post.bot_display_name ? (
              <Link
                to={`/bot/${encodeURIComponent(post.bot_display_name.replace(/^@/, ''))}`}
                className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
            ) : post.user_id && post.username ? (
              <Link
                to={`/u/${post.username}`}
                className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
            )}
            <PostTypeLabel type={post.post_type} />
          </div>
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

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
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{post.body}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => isAuthenticated && onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.liked_by_me ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
          } ${!isAuthenticated ? 'opacity-50 cursor-default' : ''}`}
        >
          <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-primary' : ''}`} />
          {post.like_count > 0 && post.like_count}
        </button>
        <button
          onClick={handleSaveClick}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isSaved ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface SocialShareCard {
  id: string;
  platform: string;
  post_url: string;
  place_name: string | null;
  caption: string | null;
  created_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

function SocialShareFeedCard({ share }: { share: SocialShareCard }) {
  const displayName = share.display_name || share.username || 'Someone';
  const timeAgo = formatDistanceToNow(new Date(share.created_at), { addSuffix: true });
  const platformLabel = share.platform === 'x' ? 'X' : share.platform.charAt(0).toUpperCase() + share.platform.slice(1);

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 transition-shadow hover:shadow-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
          {share.avatar_url ? (
            <img src={share.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground">📱 shared on {platformLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {share.place_name && (
        <div className="bg-secondary/50 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-foreground">📍 {share.place_name}</p>
        </div>
      )}

      {share.caption && (
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">"{share.caption}"</p>
      )}

      <a
        href={share.post_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Open Post
      </a>
    </div>
  );
}

const CITY_OPTIONS = [
  { value: 'all', label: 'All Cities' },
  { value: 'Richmond', label: 'Richmond, VA' },
  { value: 'Norfolk', label: 'Norfolk, VA' },
];

export default function Feed() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isPremium } = useUserEntitlements();
  const { isSaved, saveActivity, unsaveActivity } = useSavedActivities();
  const { coordinates } = useGeolocation();
  const [cityFilter, setCityFilter] = useState<string>('all');
  const { posts, loading, toggleLike } = useFeed({
    latitude: cityFilter === 'all' ? coordinates?.latitude : undefined,
    longitude: cityFilter === 'all' ? coordinates?.longitude : undefined,
    radiusMiles: cityFilter === 'all' ? 25 : undefined,
    city: cityFilter !== 'all' ? cityFilter : undefined,
  });
  const [shareOpen, setShareOpen] = useState(false);
  const [socialShares, setSocialShares] = useState<SocialShareCard[]>([]);

  const fetchSocialShares = useCallback(async () => {
    const { data } = await supabase
      .from('social_shares' as any)
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) { setSocialShares([]); return; }

    const userIds = [...new Set((data as any[]).map((s: any) => s.user_id).filter(Boolean))];
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      profileMap = new Map((profiles || []).map(p => [p.id, p]));
    }

    setSocialShares((data as any[]).map((s: any) => {
      const prof = profileMap.get(s.user_id);
      return {
        id: s.id, platform: s.platform, post_url: s.post_url,
        place_name: s.place_name, caption: s.caption, created_at: s.created_at,
        username: prof?.username || null, display_name: prof?.display_name || null, avatar_url: prof?.avatar_url || null,
      };
    }));
  }, []);

  useEffect(() => { fetchSocialShares(); }, [fetchSocialShares]);

  const handleSaveFeedPost = (post: FeedPost) => {
    saveActivity({
      activity_type: 'feed_post',
      title: post.title || post.result_name,
      venue: null,
      description: post.body || null,
      category: post.result_category || post.post_type,
      event_date: null,
      event_time: null,
      source_url: null,
      place_name: post.result_name || null,
      latitude: post.lat || null,
      longitude: post.lng || null,
      address: post.result_address || null,
      feed_post_id: post.id,
    });
  };

  const handleUnsaveFeedPost = (post: FeedPost) => {
    unsaveActivity('feed_post', post.title || post.result_name, null);
  };

  const handleUpgrade = () => {
    toast('Plus members can save activities ✨', {
      description: 'Upgrade to save events and posts to your profile.',
      action: { label: 'Upgrade', onClick: () => navigate('/membership') },
    });
  };

  const mergedFeed = [
    ...posts.map(p => ({ type: 'post' as const, data: p, created_at: p.created_at })),
    ...socialShares.map(s => ({ type: 'share' as const, data: s, created_at: s.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <SharePostModal open={shareOpen} onClose={() => { setShareOpen(false); fetchSocialShares(); }} />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold">Community Activity</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cityFilter !== 'all'
                ? `Showing activity in ${cityFilter}`
                : coordinates
                  ? 'Showing activity within 25 miles'
                  : 'Showing all recent activity'}
            </p>
          </div>
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          )}
        </div>

        <div className="mb-5">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px] bg-card border-border/50">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {CITY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading feed…</p>
          </div>
        ) : mergedFeed.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold mb-1">Be the first to discover something ✨</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Spin the wheel and your discovery will show up here for others nearby.
            </p>
            <Button variant="hero" onClick={() => navigate('/')}>
              <Sparkles className="w-4 h-4 mr-2" /> Spin Now
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mergedFeed.map(item =>
              item.type === 'share' ? (
                <SocialShareFeedCard key={`share-${item.data.id}`} share={item.data as SocialShareCard} />
              ) : (
                <FeedCard
                  key={`post-${(item.data as FeedPost).id}`}
                  post={item.data as FeedPost}
                  onLike={toggleLike}
                  isAuthenticated={isAuthenticated}
                  isPremium={isPremium}
                  isSaved={isSaved('feed_post', (item.data as FeedPost).title || (item.data as FeedPost).result_name, null)}
                  onSave={() => handleSaveFeedPost(item.data as FeedPost)}
                  onUnsave={() => handleUnsaveFeedPost(item.data as FeedPost)}
                  onUpgrade={handleUpgrade}
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
