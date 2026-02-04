import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocalEvent {
  name: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  type?: 'music' | 'sports' | 'festival' | 'comedy' | 'food' | 'art' | 'other';
}

export type Timeframe = 'today' | 'week' | 'month';

interface UseEventSearchReturn {
  events: LocalEvent[];
  isLoading: boolean;
  error: string | null;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  searchEvents: (spotName: string, spotCategory: string, city?: string) => Promise<void>;
}

export function useEventSearch(): UseEventSearchReturn {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');

  const searchEvents = useCallback(async (spotName: string, spotCategory: string, city?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-events', {
        body: {
          spotName,
          spotCategory,
          timeframe,
          city,
        },
      });

      if (fnError) {
        console.error('Event search error:', fnError);
        setError('Failed to search for events');
        setEvents([]);
        return;
      }

      if (data?.events && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Event search error:', err);
      setError('Failed to search for events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  return {
    events,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    searchEvents,
  };
}