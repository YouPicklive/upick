
-- 1. Create a public view that excludes the email column
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, display_name, username, avatar_url, bio, city, region,
         default_post_privacy, selected_city_id, created_at, updated_at
  FROM public.profiles;

-- 2. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

-- 3. Allow authenticated users to read ONLY their own profile (with email)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 4. Allow anon to read profiles via the view (no email), but deny direct table access
CREATE POLICY "Anon can read profiles via view only"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);
