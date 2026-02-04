-- Create security definer function to check if user has plus subscription
CREATE OR REPLACE FUNCTION public.user_has_plus(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements
    WHERE user_id = check_user_id
      AND plus_active = true
  )
$$;

-- Create security definer function to check if user owns a specific pack
CREATE OR REPLACE FUNCTION public.user_owns_pack(check_user_id uuid, pack_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements
    WHERE user_id = check_user_id
      AND (plus_active = true OR pack_key = ANY(owned_packs))
  )
$$;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Fortunes are publicly readable" ON public.fortunes;

-- Policy 1: Free tier fortunes are publicly readable
CREATE POLICY "Free fortunes are publicly readable"
ON public.fortunes
FOR SELECT
USING (active = true AND tier = 'free');

-- Policy 2: Plus tier fortunes require plus subscription
CREATE POLICY "Plus fortunes require subscription"
ON public.fortunes
FOR SELECT
TO authenticated
USING (
  active = true 
  AND tier = 'plus' 
  AND public.user_has_plus(auth.uid())
);

-- Policy 3: Pack fortunes require owning the pack (or plus subscription)
CREATE POLICY "Pack fortunes require ownership"
ON public.fortunes
FOR SELECT
TO authenticated
USING (
  active = true 
  AND tier = 'pack' 
  AND public.user_owns_pack(auth.uid(), pack_key)
);