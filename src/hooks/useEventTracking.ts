import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

type TrackableEvent =
  | 'session_started'
  | 'spin_completed'
  | 'respin_clicked'
  | 'experience_marked_tried'
  | 'subscription_started';

export function useEventTracking() {
  const { user, isAuthenticated } = useAuth();

  const track = useCallback(async (eventName: TrackableEvent, metadata?: Record<string, unknown>) => {
    if (!isAuthenticated || !user) return;
    try {
      await supabase
        .from('event_logs' as any)
        .insert({ user_id: user.id, event_name: eventName, metadata: metadata ?? {} });
    } catch (err) {
      logger.warn('Event tracking failed:', err);
    }
  }, [isAuthenticated, user?.id]);

  return { track };
}
