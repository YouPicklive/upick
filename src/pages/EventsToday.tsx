import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useSavedActivities } from '@/hooks/useSavedActivities';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar, Clock, MapPin, Loader2, ExternalLink, RefreshCw, Bookmark, BookmarkCheck, Star,
  Music, Trophy, Palette, Drama, UtensilsCrossed, Users, Heart, ShoppingBag, Sparkles, PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LocalEvent {
  name: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  type?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  sourceUrl?: string;
  distance?: number;
}

type Timeframe = 'today' | 'week' | 'month';

const TYPE_ICONS: Record<string, typeof Music> = {
  music: Music,
  sports: Trophy,
  art: Palette,
  comedy: Drama,
  food: UtensilsCrossed,
  community: Users,
  wellness: Heart,
  family: Sparkles,
  market: ShoppingBag,
  festival: PartyPopper,
};

const TYPE_COLORS: Record<string, string> = {
  music: 'bg-purple-500/10 text-purple-600',
  sports: 'bg-green-500/10 text-green-600',
  art: 'bg-pink-500/10 text-pink-600',
  comedy: 'bg-yellow-500/10 text-yellow-700',
  food: 'bg-orange-500/10 text-orange-600',
  community: 'bg-blue-500/10 text-blue-600',
  wellness: 'bg-teal-500/10 text-teal-600',
  family: 'bg-indigo-500/10 text-indigo-600',
  market: 'bg-amber-500/10 text-amber-700',
  festival: 'bg-red-500/10 text-red-600',
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceLabel(miles: number): string {
  if (miles < 1) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(1)} mi`;
}

function EventCard({ event, isPremium, isAuthenticated, isSaved, onSave, onUnsave, onUpgrade }: {
  event: LocalEvent;
  isPremium: boolean;
  isAuthenticated: boolean;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onUpgrade: () => void;
}) {
  const Icon = TYPE_ICONS[event.type || 'other'] || Calendar;
  const colorClass = TYPE_COLORS[event.type || 'other'] || 'bg-secondary text-muted-foreground';

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast('Sign in to save events', { description: 'Create an account to start saving.' });
      return;
    }
    if (!isPremium) { onUpgrade(); return; }
    if (isSaved) onUnsave(); else onSave();
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-card hover:border-primary/20 transition-all group">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {event.name}
            </h3>
          </a>
          {event.venue && (
            <p className="text-xs text-muted-foreground mt-0.5">📍 {event.venue}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSaveClick}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/5'
            }`}
            title={isSaved ? 'Remove from saved' : isPremium ? 'Save to profile' : 'Plus members can save events'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-1.5">
            <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </a>
        </div>
      </div>

      {event.description && (
        <p className="text-xs text-foreground/70 mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {event.category && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
            {event.category}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {event.date}
        </span>
        {event.time && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {event.time}
          </span>
        )}
        {event.distance !== undefined && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {distanceLabel(event.distance)}
          </span>
        )}
      </div>
    </div>
  );
}

// Session cache
const cache = new Map<string, { events: LocalEvent[]; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export default function EventsToday() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isPremium } = useUserEntitlements();
  const { isSaved, saveActivity, unsaveActivity } = useSavedActivities();
  const { coordinates } = useGeolocation();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [filterType, setFilterType] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval>>();

  // Coordinates: GPS > Richmond fallback
  const effectiveLat = coordinates?.latitude ?? 37.5407;
  const effectiveLng = coordinates?.longitude ?? -77.4360;
  const locationLabel = coordinates ? 'Near you' : 'Richmond, VA area';

  const fetchEvents = useCallback(async () => {
    const cacheKey = `${timeframe}|${effectiveLat.toFixed(2)}|${effectiveLng.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setEvents(cached.events);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-events', {
        body: {
          timeframe,
          city: 'Near me',
          mode: 'discover',
          latitude: effectiveLat,
          longitude: effectiveLng,
          radiusMiles: 25,
        },
      });

      if (error || !data?.events) {
        setEvents([]);
        return;
      }

      let processed: LocalEvent[] = data.events;

      processed = processed.map((e: LocalEvent) => {
        if (e.latitude && e.longitude) {
          return { ...e, distance: haversine(effectiveLat, effectiveLng, e.latitude, e.longitude) };
        }
        return e;
      });
      processed.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

      cache.set(cacheKey, { events: processed, ts: Date.now() });
      setEvents(processed);
    } catch (err) {
      console.error('Event fetch error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe, effectiveLat, effectiveLng]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    refreshTimer.current = setInterval(fetchEvents, 60_000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchEvents]);

  const handleSaveEvent = (event: LocalEvent) => {
    saveActivity({
      activity_type: 'event',
      title: event.name,
      venue: event.venue || null,
      description: event.description || null,
      category: event.category || event.type || null,
      event_date: event.date || null,
      event_time: event.time || null,
      source_url: event.sourceUrl || null,
      place_name: event.venue || null,
      latitude: event.latitude || null,
      longitude: event.longitude || null,
      address: event.address || null,
      feed_post_id: null,
    });
  };

  const handleUnsaveEvent = (event: LocalEvent) => {
    unsaveActivity('event', event.name, event.venue);
  };

  const handleUpgrade = () => {
    toast('Plus members can save events ✨', {
      description: 'Upgrade to save activities to your profile.',
      action: { label: 'Upgrade', onClick: () => navigate('/membership') },
    });
  };

  const availableTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
  const displayed = filterType ? events.filter(e => e.type === filterType) : events;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Events Near You
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locationLabel} · Within 25 miles
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { cache.clear(); fetchEvents(); }}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Timeframe pills */}
        <div className="flex gap-2 mb-4">
          {(['today', 'week', 'month'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); setFilterType(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                timeframe === tf
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        {!loading && availableTypes.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            <button
              onClick={() => setFilterType(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                !filterType ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border hover:border-foreground/30'
              }`}
            >
              All
            </button>
            {availableTypes.map(t => {
              const Icon = TYPE_ICONS[t!] || Calendar;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t === filterType ? null : t!)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                    filterType === t ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border hover:border-foreground/30'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t!.charAt(0).toUpperCase() + t!.slice(1)}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Discovering local events…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold mb-1">No events found</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Try expanding to "This Week" or "This Month" for more results.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((event, i) => (
              <EventCard
                key={`${event.name}-${i}`}
                event={event}
                isPremium={isPremium}
                isAuthenticated={isAuthenticated}
                isSaved={isSaved('event', event.name, event.venue)}
                onSave={() => handleSaveEvent(event)}
                onUnsave={() => handleUnsaveEvent(event)}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
