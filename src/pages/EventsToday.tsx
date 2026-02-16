import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar, Clock, MapPin, Loader2, ExternalLink, RefreshCw,
  Music, Trophy, Palette, Drama, UtensilsCrossed, Users, Heart, ShoppingBag, Sparkles, PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function EventCard({ event }: { event: LocalEvent }) {
  const Icon = TYPE_ICONS[event.type || 'other'] || Calendar;
  const colorClass = TYPE_COLORS[event.type || 'other'] || 'bg-secondary text-muted-foreground';

  return (
    <a
      href={event.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card rounded-xl border border-border/50 p-4 hover:shadow-card hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {event.name}
          </h3>
          {event.venue && (
            <p className="text-xs text-muted-foreground mt-0.5">📍 {event.venue}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 transition-colors" />
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
    </a>
  );
}

// Session cache
const cache = new Map<string, { events: LocalEvent[]; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export default function EventsToday() {
  const { coordinates } = useGeolocation();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [filterType, setFilterType] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval>>();

  const fetchEvents = useCallback(async () => {
    const city = 'Richmond, VA';
    const cacheKey = `${timeframe}|${coordinates?.latitude?.toFixed(2)}|${coordinates?.longitude?.toFixed(2)}`;
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
          city,
          mode: 'discover',
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          radiusMiles: 25,
        },
      });

      if (error || !data?.events) {
        setEvents([]);
        return;
      }

      let processed: LocalEvent[] = data.events;

      // Add distances
      if (coordinates) {
        processed = processed.map((e: LocalEvent) => {
          if (e.latitude && e.longitude) {
            return { ...e, distance: haversine(coordinates.latitude, coordinates.longitude, e.latitude, e.longitude) };
          }
          return e;
        });
        // Sort by distance
        processed.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      }

      cache.set(cacheKey, { events: processed, ts: Date.now() });
      setEvents(processed);
    } catch (err) {
      console.error('Event fetch error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe, coordinates?.latitude, coordinates?.longitude]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh every 60s
  useEffect(() => {
    refreshTimer.current = setInterval(fetchEvents, 60_000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchEvents]);

  const availableTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
  const displayed = filterType ? events.filter(e => e.type === filterType) : events;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Events Near You
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {coordinates ? 'Within 25 miles' : 'Richmond, VA area'}
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
              <EventCard key={`${event.name}-${i}`} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
