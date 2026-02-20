
-- ============================================================
-- Patch: redeem_mile_marker_reward atomicity + race-safe balance
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
  v_cost int;
  v_available int;
  v_reward_active boolean;
  v_balance int;
  v_code text;
BEGIN
  -- Plus-only (or admin)
  SELECT (plus_active = true) INTO v_is_plus
  FROM public.user_entitlements WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_plus, false) AND NOT public.has_role(p_user_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_plus');
  END IF;

  -- Fast idempotency check; UNIQUE constraint is the real guard (see EXCEPTION)
  IF EXISTS (SELECT 1 FROM public.reward_redemptions WHERE request_id = p_request_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_request');
  END IF;

  -- Lock reward row for consistent stock / cost checks
  SELECT points_cost, active, quantity_available
  INTO v_cost, v_reward_active, v_available
  FROM public.rewards
  WHERE id = p_reward_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_reward_active THEN
    RETURN jsonb_build_object('success', false, 'reason', 'reward_not_found');
  END IF;

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  -- Ensure balance row exists, then lock it
  INSERT INTO public.mile_markers (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT points_balance
  INTO v_balance
  FROM public.mile_markers
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance');
  END IF;

  -- Decrement stock (still guarded; should always succeed due to lock)
  UPDATE public.rewards
  SET quantity_available = quantity_available - 1
  WHERE id = p_reward_id AND quantity_available > 0;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock');
  END IF;

  -- Deduct points with guard (prevents double-spend races cleanly)
  UPDATE public.mile_markers
  SET points_balance = points_balance - v_cost,
      updated_at = now()
  WHERE user_id = p_user_id AND points_balance >= v_cost;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance');
  END IF;

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

EXCEPTION
  WHEN unique_violation THEN
    -- request_id already used; entire transaction rolls back automatically
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_request');
END;
$$;
