
-- Allow service role to update spin_events (edge function marks posted_to_feed_at)
CREATE POLICY "Service role can update spin events" ON public.spin_events
  FOR UPDATE USING (true) WITH CHECK (true);
