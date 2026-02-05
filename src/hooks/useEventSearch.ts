import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocalEvent {
  name: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  type?: 'music' | 'sports' | 'festival' | 'comedy' | 'food' | 'art' | 'other';
   latitude?: number;
   longitude?: number;
   address?: string;
   distance?: number; // Calculated client-side based on user location
}

export type Timeframe = 'today' | 'week' | 'month';

interface UseEventSearchReturn {
  events: LocalEvent[];
  isLoading: boolean;
  error: string | null;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
   searchEvents: (spotName: string, spotCategory: string, city?: string, userCoords?: { latitude: number; longitude: number } | null) => Promise<void>;
}

export function useEventSearch(): UseEventSearchReturn {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');

   // Haversine formula for distance calculation
   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
     const R = 3958.8; // Earth's radius in miles
     const dLat = (lat2 - lat1) * (Math.PI / 180);
     const dLon = (lon2 - lon1) * (Math.PI / 180);
     const a =
       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
       Math.cos(lat1 * (Math.PI / 180)) *
         Math.cos(lat2 * (Math.PI / 180)) *
         Math.sin(dLon / 2) *
         Math.sin(dLon / 2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     return R * c;
   };
 
   const searchEvents = useCallback(async (spotName: string, spotCategory: string, city?: string, userCoords?: { latitude: number; longitude: number } | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-events', {
        body: {
          spotName,
          spotCategory,
          timeframe,
          city,
           userLatitude: userCoords?.latitude,
           userLongitude: userCoords?.longitude,
        },
      });

      if (fnError) {
        console.error('Event search error:', fnError);
        setError('Failed to search for events');
        setEvents([]);
        return;
      }

      if (data?.events && Array.isArray(data.events)) {
         // Calculate distance for each event if user coordinates are available
         const eventsWithDistance = data.events.map((event: LocalEvent) => {
           if (userCoords && event.latitude && event.longitude) {
             const distance = calculateDistance(
               userCoords.latitude,
               userCoords.longitude,
               event.latitude,
               event.longitude
             );
             return { ...event, distance };
           }
           return event;
         });
         
         // Sort by distance if available
         eventsWithDistance.sort((a: LocalEvent, b: LocalEvent) => {
           if (a.distance !== undefined && b.distance !== undefined) {
             return a.distance - b.distance;
           }
           return 0;
         });
         
         setEvents(eventsWithDistance);
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