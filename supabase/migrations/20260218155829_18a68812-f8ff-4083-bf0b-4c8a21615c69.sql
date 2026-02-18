
-- 1. Drop old permissive anon policy if it still exists
DROP POLICY IF EXISTS "Anon can read profiles via view only" ON public.profiles;

-- 2. Drop and recreate profiles_public WITHOUT security_invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT id, username, display_name, avatar_url, bio, city, region,
         default_post_privacy, selected_city_id, created_at, updated_at
  FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 3. Drop and recreate bot_profiles_public WITHOUT security_invoker
DROP VIEW IF EXISTS public.bot_profiles_public;
CREATE VIEW public.bot_profiles_public AS
  SELECT id, bot_slug, display_name, avatar_url, city, region, timezone, is_bot
  FROM public.profiles
  WHERE is_bot = true;
GRANT SELECT ON public.bot_profiles_public TO anon, authenticated;
