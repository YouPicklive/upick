-- Drop the dangerous policies that allow users to modify their own entitlements
DROP POLICY IF EXISTS "Users can create their own entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Users can update their own entitlements" ON public.user_entitlements;

-- Create a trigger function to auto-create entitlements when a user signs up
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

-- Create trigger on auth.users to auto-create entitlements
DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_entitlements();

-- Add unique constraint on user_id if not exists (for ON CONFLICT to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_entitlements_user_id_key'
  ) THEN
    ALTER TABLE public.user_entitlements ADD CONSTRAINT user_entitlements_user_id_key UNIQUE (user_id);
  END IF;
END $$;