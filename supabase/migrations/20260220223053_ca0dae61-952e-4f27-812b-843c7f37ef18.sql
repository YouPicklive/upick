
-- ============================================================
-- Mile Markers Phase 1 Migration
-- ============================================================

-- 1. mile_markers: one balance row per user
CREATE TABLE IF NOT EXISTS public.mile_markers (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance int NOT NULL DEFAULT 0,
  lifetime_points int NOT NULL DEFAULT 0,
  last_daily_award_date date NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT points_balance_non_negative CHECK (points_balance >= 0),
  CONSTRAINT lifetime_points_non_negative CHECK (lifetime_points >= 0)
);

-- 2. mile_marker_transactions: immutable ledger
CREATE TABLE IF NOT EXISTS public.mile_marker_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn', 'redeem')),
  points int NOT NULL CHECK (points > 0),
  reason text NOT NULL CHECK (reason IN ('daily_open','spin','save','like','share','checkin','redeem_reward')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mmt_user_id ON public.mile_marker_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mmt_user_created ON public.mile_marker_transactions(user_id, created_at DESC);

-- 3. rewards: admin-managed marketplace
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_cost int NOT NULL CHECK (points_cost > 0),
  partner_business_id uuid NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('gift_card','ticket','class','experience','getaway')),
  quantity_available int NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. reward_redemptions: claimed rewards with idempotency guard
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id),
  points_spent int NOT NULL CHECK (points_spent > 0),
  redemption_code text NOT NULL,
  request_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','redeemed','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_request_id UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_rr_user_id ON public.reward_redemptions(user_id);

-- RLS
ALTER TABLE public.mile_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mile_marker_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mile markers"
  ON public.mile_markers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON public.mile_marker_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Active rewards are publicly readable"
  ON public.rewards FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage rewards"
  ON public.rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own redemptions"
  ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);

-- updated_at trigger on mile_markers
CREATE TRIGGER update_mile_markers_updated_at
  BEFORE UPDATE ON public.mile_markers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC: award_mile_markers (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_mile_markers(
  p_user_id uuid,
  p_reason text,
  p_points int,
  p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_plus boolean;
  v_timezone text;
  v_today_date date;
  v_today_earned int;
  v_actual_points int;
  v_new_balance int;
  v_last_daily date;
BEGIN
  SELECT (plus_active = true) INTO v_is_plus
  FROM public.user_entitlements WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_plus, false) AND NOT public.has_role(p_user_id, 'admin') THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'not_plus');
  END IF;

  SELECT COALESCE(timezone, 'America/New_York') INTO v_timezone
  FROM public.profiles WHERE id = p_user_id;

  v_today_date := (now() AT TIME ZONE v_timezone)::date;

  SELECT COALESCE(SUM(points), 0) INTO v_today_earned
  FROM public.mile_marker_transactions
  WHERE user_id = p_user_id
    AND type = 'earn'
    AND (created_at AT TIME ZONE v_timezone)::date = v_today_date;

  IF v_today_earned >= 75 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'daily_cap');
  END IF;

  IF p_reason = 'daily_open' THEN
    SELECT last_daily_award_date INTO v_last_daily
    FROM public.mile_markers WHERE user_id = p_user_id;
    IF v_last_daily IS NOT NULL AND v_last_daily = v_today_date THEN
      RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded_today');
    END IF;
  END IF;

  v_actual_points := LEAST(p_points, 75 - v_today_earned);

  INSERT INTO public.mile_markers (
    user_id, points_balance, lifetime_points, last_daily_award_date, updated_at
  ) VALUES (
    p_user_id, v_actual_points, v_actual_points,
    CASE WHEN p_reason = 'daily_open' THEN v_today_date ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = public.mile_markers.points_balance + v_actual_points,
    lifetime_points = public.mile_markers.lifetime_points + v_actual_points,
    last_daily_award_date = CASE
      WHEN p_reason = 'daily_open' THEN v_today_date
      ELSE public.mile_markers.last_daily_award_date
    END,
    updated_at = now();

  INSERT INTO public.mile_marker_transactions (user_id, type, points, reason, metadata)
  VALUES (p_user_id, 'earn', v_actual_points, p_reason, p_metadata);

  SELECT points_balance INTO v_new_balance FROM public.mile_markers WHERE user_id = p_user_id;
  RETURN jsonb_build_object('awarded', true, 'points_given', v_actual_points, 'new_balance', v_new_balance);
END;
$$;

-- ============================================================
-- RPC: redeem_mile_marker_reward (atomic + idempotent, SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_mile_marker_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_request_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_plus boolean;
  v_balance int;
  v_cost int;
  v_available int;
  v_reward_active boolean;
  v_code text;
BEGIN
  SELECT (plus_active = true) INTO v_is_plus
  FROM public.user_entitlements WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_plus, false) AND NOT public.has_role(p_user_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_plus');
  END IF;

  IF EXISTS (SELECT 1 FROM public.reward_redemptions WHERE request_id = p_request_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_request');
  END IF;

  SELECT points_cost, active, quantity_available
  INTO v_cost, v_reward_active, v_available
  FROM public.rewards WHERE id = p_reward_id;

  IF NOT FOUND OR NOT v_reward_active THEN
    RETURN jsonb_build_object('success', false, 'reason', 'reward_not_found');
  END IF;

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  SELECT points_balance INTO v_balance FROM public.mile_markers WHERE user_id = p_user_id;
  IF v_balance IS NULL OR v_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance');
  END IF;

  -- Atomic decrement: only if still in stock
  UPDATE public.rewards
  SET quantity_available = quantity_available - 1
  WHERE id = p_reward_id AND quantity_available > 0;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  UPDATE public.mile_markers
  SET points_balance = points_balance - v_cost, updated_at = now()
  WHERE user_id = p_user_id;

  v_code := upper(substring(md5(random()::text || p_user_id::text || now()::text) from 1 for 8));

  INSERT INTO public.reward_redemptions (
    user_id, reward_id, points_spent, redemption_code, request_id, status
  ) VALUES (
    p_user_id, p_reward_id, v_cost, v_code, p_request_id, 'pending'
  );

  INSERT INTO public.mile_marker_transactions (user_id, type, points, reason, metadata)
  VALUES (
    p_user_id, 'redeem', v_cost, 'redeem_reward',
    jsonb_build_object('reward_id', p_reward_id, 'code', v_code, 'request_id', p_request_id)
  );

  RETURN jsonb_build_object('success', true, 'code', v_code);
END;
$$;
