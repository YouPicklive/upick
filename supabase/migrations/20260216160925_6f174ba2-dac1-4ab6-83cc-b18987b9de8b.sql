
-- Table for Plus members to save activities (events, feed posts, etc.) to their profile
CREATE TABLE public.saved_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'event', 'feed_post', 'social_share'
  title text NOT NULL,
  venue text,
  description text,
  category text,
  event_date text,
  event_time text,
  source_url text,
  place_name text,
  latitude double precision,
  longitude double precision,
  address text,
  -- reference to feed_post if saved from feed
  feed_post_id uuid,
  -- prevent duplicates
  UNIQUE(user_id, title, activity_type, venue)
);

ALTER TABLE public.saved_activities ENABLE ROW LEVEL SECURITY;

-- Only authenticated Plus users can insert (enforced in app code, RLS allows auth insert)
CREATE POLICY "Users can insert own saved activities"
ON public.saved_activities
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view their own saved activities
CREATE POLICY "Users can view own saved activities"
ON public.saved_activities
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own saved activities
CREATE POLICY "Users can delete own saved activities"
ON public.saved_activities
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Public can see saved activities on profiles (for profile display)
CREATE POLICY "Public can read saved activities"
ON public.saved_activities
FOR SELECT
USING (true);
