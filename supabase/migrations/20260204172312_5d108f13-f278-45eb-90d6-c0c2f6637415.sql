-- Remove dangerous policies that allow users to modify their own entitlements
DROP POLICY IF EXISTS "Users can create their own entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Users can update their own entitlements" ON public.user_entitlements;

-- Ensure the service role policy exists for the webhook to work
-- Note: Service role bypasses RLS by default, but being explicit is good practice
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_entitlements' 
    AND policyname = 'Service role can manage entitlements'
  ) THEN
    CREATE POLICY "Service role can manage entitlements"
      ON public.user_entitlements
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure the trigger for auto-creating entitlements on signup still works
-- This runs as SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_entitlements (user_id, plus_active, owned_packs)
  VALUES (NEW.id, false, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_entitlements();