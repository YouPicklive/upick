
-- =============================================
-- Phase 1A: Create profiles table
-- =============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================
-- Phase 1B: Add spin tracking columns to user_entitlements
-- =============================================
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS unlimited_spins boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_save_fortunes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_spin_limit_per_day int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS spins_used_today int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spins_reset_date date NOT NULL DEFAULT CURRENT_DATE;

-- Backfill existing plus users
UPDATE public.user_entitlements
SET tier = 'plus', unlimited_spins = true, can_save_fortunes = true
WHERE plus_active = true;

-- =============================================
-- Phase 1C: Create saved_fortunes table
-- =============================================
CREATE TABLE public.saved_fortunes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fortune_pack_id text,
  fortune_text text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_fortunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved fortunes"
  ON public.saved_fortunes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved fortunes"
  ON public.saved_fortunes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved fortunes"
  ON public.saved_fortunes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- Phase 1D: Create stripe_customers table
-- =============================================
CREATE TABLE public.stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- Phase 1E: Create stripe_subscriptions table
-- =============================================
CREATE TABLE public.stripe_subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id)
);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.stripe_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- Phase 1F: Update trigger to auto-create profile + entitlements
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_entitlements();

-- =============================================
-- Phase 1G: Create check_and_consume_spin RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.check_and_consume_spin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_unlimited boolean;
  v_limit int;
  v_used int;
  v_reset_date date;
BEGIN
  SELECT tier, unlimited_spins, free_spin_limit_per_day,
         spins_used_today, spins_reset_date
  INTO v_tier, v_unlimited, v_limit, v_used, v_reset_date
  FROM public.user_entitlements
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_entitlements');
  END IF;

  IF v_tier = 'plus' OR v_unlimited THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'plus');
  END IF;

  IF v_reset_date != CURRENT_DATE THEN
    v_used := 0;
    UPDATE public.user_entitlements
    SET spins_used_today = 0, spins_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached',
      'used', v_used, 'limit', v_limit);
  END IF;

  UPDATE public.user_entitlements
  SET spins_used_today = spins_used_today + 1
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('allowed', true, 'reason', 'free_remaining',
    'remaining', v_limit - v_used - 1);
END;
$$;

-- =============================================
-- Backfill profiles for existing auth users
-- =============================================
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
