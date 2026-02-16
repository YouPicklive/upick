
-- Drop the overly permissive policy (service role bypasses RLS anyway)
DROP POLICY "Service role can update spin events" ON public.spin_events;
