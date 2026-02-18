
-- 1. Add bot identity fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_slug text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- 2. Unique index on bot_slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_bot_slug
  ON public.profiles (bot_slug) WHERE bot_slug IS NOT NULL;

-- 3. Bot-only SELECT policy on profiles (drop first to be safe)
DROP POLICY IF EXISTS "Anyone can read bot profiles" ON public.profiles;
CREATE POLICY "Anyone can read bot profiles"
  ON public.profiles FOR SELECT
  USING (is_bot = true);

-- 4. Create bot_profiles_public view (public-safe, non-sensitive fields only)
CREATE OR REPLACE VIEW public.bot_profiles_public
  WITH (security_invoker = on) AS
  SELECT id, bot_slug, display_name, avatar_url, city, region, timezone, is_bot
  FROM public.profiles
  WHERE is_bot = true;

-- 5. Explicit GRANTs on the view
GRANT SELECT ON public.bot_profiles_public TO anon, authenticated;

-- 6. Feed post indexes for bot throttle queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_city_created
  ON public.feed_posts (city, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created
  ON public.feed_posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_posts_bot_city_created
  ON public.feed_posts (is_bot, city, created_at DESC) WHERE is_bot = true;
