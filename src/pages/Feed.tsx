import { GlobalHeader } from '@/components/GlobalHeader';
import { useFeed, FeedPost } from '@/hooks/useFeed';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MapPin, Loader2, Sparkles, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

function PostTypeLabel({ type }: { type: string }) {
  const labels: Record<string, { text: string; emoji: string }> = {
    spin: { text: 'spun fate', emoji: '🎡' },
    save: { text: 'saved a spot', emoji: '📌' },
    review: { text: 'shared a review', emoji: '✍️' },
    post: { text: 'posted', emoji: '💬' },
    business_event: { text: 'posted an event', emoji: '📅' },
  };
  const label = labels[type] || { text: type, emoji: '📝' };
  return (
    <span className="text-xs text-muted-foreground">
      {label.emoji} {label.text}
    </span>
  );
}

function FeedCard({ post, onLike, isAuthenticated }: { post: FeedPost; onLike: (id: string) => void; isAuthenticated: boolean }) {
  const displayName = post.display_name || post.username || 'Someone';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 transition-shadow hover:shadow-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
          {post.avatar_url ? (
            <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {displayName[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
            <PostTypeLabel type={post.type} />
          </div>
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Place card */}
      {post.place_name && (
        <div className="bg-secondary/50 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-foreground">{post.place_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {post.place_category && (
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                {post.place_category}
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

      {/* Content */}
      {post.content && (
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{post.content}</p>
      )}

      {/* Event time */}
      {post.event_starts_at && (
        <p className="text-xs text-accent font-medium mb-3">
          📅 {new Date(post.event_starts_at).toLocaleDateString()} at{' '}
          {new Date(post.event_starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}

      {/* Actions */}
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
      </div>
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { coordinates } = useGeolocation();
  const { posts, loading, toggleLike } = useFeed({
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    radiusMiles: 25,
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold">Nearby Activity</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {coordinates ? 'Showing activity within 25 miles' : 'Showing all recent activity'}
            </p>
          </div>
          <Compass className="w-5 h-5 text-muted-foreground/40" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading feed…</p>
          </div>
        ) : posts.length === 0 ? (
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
            {posts.map(post => (
              <FeedCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
