
-- 1. Drop the overly permissive anon policy that exposes email
DROP POLICY IF EXISTS "Anon can read profiles via view only" ON public.profiles;

-- 2. Deny anonymous direct access to the profiles base table
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles AS RESTRICTIVE FOR SELECT
  TO anon
  USING (false);

-- 3. Allow authenticated users to read all profiles (needed for feed/social features)
-- The "Users can view own profile" policy is redundant once this exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
