
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text;

-- Add INSERT policy (currently missing - the trigger uses SECURITY DEFINER so it works, but users should also be able to insert their own)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Update the signup trigger to auto-generate username from email
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  final_username text;
  suffix int;
BEGIN
  -- Generate username from email
  base_username := lower(split_part(NEW.email, '@', 1));
  -- Remove non-alphanumeric/underscore chars
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  -- Ensure minimum length
  IF length(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  -- Truncate to leave room for suffix
  base_username := left(base_username, 16);
  
  -- Try base username first, then append random suffix
  final_username := base_username;
  suffix := 0;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || (floor(random() * 9000) + 1000)::text;
    IF suffix > 10 THEN
      final_username := base_username || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  -- Create profile with auto-generated username
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    initcap(split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    username = CASE WHEN public.profiles.username IS NULL THEN EXCLUDED.username ELSE public.profiles.username END,
    display_name = CASE WHEN public.profiles.display_name IS NULL THEN EXCLUDED.display_name ELSE public.profiles.display_name END;

  -- Create entitlements
  INSERT INTO public.user_entitlements (
    user_id, plus_active, owned_packs, tier,
    unlimited_spins, can_save_fortunes,
    free_spin_limit_per_day, spins_used_today, spins_reset_date
  )
  VALUES (
    NEW.id, false, '{}', 'free',
    false, false, 1, 0, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Add unique constraint on username if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;
