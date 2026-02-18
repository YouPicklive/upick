
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.profiles;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
