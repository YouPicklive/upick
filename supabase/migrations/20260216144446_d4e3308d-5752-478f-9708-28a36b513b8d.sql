
-- Add owner_user_id to businesses for business owner posting
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Posts table for community feed
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('spin', 'save', 'review', 'post', 'business_event')),
  content text,
  place_name text,
  place_id text,
  place_category text,
  city text,
  latitude double precision,
  longitude double precision,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts (public feed)
CREATE POLICY "Posts are publicly readable"
  ON public.posts FOR SELECT
  USING (true);

-- Authenticated users can insert their own posts
CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Post likes table
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are publicly readable"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Index for feed queries
CREATE INDEX idx_posts_city_created ON public.posts (city, created_at DESC);
CREATE INDEX idx_posts_type_created ON public.posts (type, created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes (post_id);

-- Make profiles publicly readable (for feed username display)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);
