import { GlobalHeader } from '@/components/GlobalHeader';
import { useFeed } from '@/hooks/useFeed';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MapPin, Loader2, Calendar, Clock } from 'lucide-react';
import { useEffect } from 'react';

export default function EventsToday() {
  const { isAuthenticated } = useAuth();
  const { coordinates } = useGeolocation();
  const { posts, loading, toggleLike, refresh } = useFeed({
    type: 'business_event',
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    radiusMiles: 25,
  });

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Filter to today's events or upcoming
  const now = new Date();
  const todayEvents = posts.filter(p => {
    if (!p.event_starts_at) return true; // Show events without specific time
    const start = new Date(p.event_starts_at);
    const end = p.event_ends_at ? new Date(p.event_ends_at) : null;
    // Show if event is today or hasn't ended yet
    return start.toDateString() === now.toDateString() || start > now || (end && end > now);
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Events Today
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Local happenings near you
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Finding events…</p>
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold mb-1">No events posted yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Business owners can post events here. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents.map(event => {
              const displayName = event.display_name || event.username || 'Local Business';
              return (
                <div key={event.id} className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-card transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{displayName}</span>
                      <p className="text-[11px] text-muted-foreground">📅 posted an event</p>
                    </div>
                  </div>

                  {/* Event details */}
                  {event.place_name && (
                    <h3 className="text-base font-bold text-foreground mb-1">{event.place_name}</h3>
                  )}

                  {event.content && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">{event.content}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    {event.event_starts_at && (
                      <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(event.event_starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                    {event.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.city}
                      </span>
                    )}
                    {event.place_category && (
                      <span className="bg-secondary px-2 py-0.5 rounded-full capitalize">{event.place_category}</span>
                    )}
                  </div>

                  {/* Like */}
                  <button
                    onClick={() => isAuthenticated && toggleLike(event.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      event.liked_by_me ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
                    } ${!isAuthenticated ? 'opacity-50 cursor-default' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${event.liked_by_me ? 'fill-primary' : ''}`} />
                    {event.like_count > 0 && event.like_count}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
