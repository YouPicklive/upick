
-- Add alignment & experience fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experiences_completed_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS alignment_streak_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_spin_date date;

-- Create event_logs table for basic event tracking
CREATE TABLE public.event_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
ON public.event_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can read their own events
CREATE POLICY "Users can read own events"
ON public.event_logs
FOR SELECT
USING (user_id = auth.uid());

-- Update profiles RLS: users need to update their own streak/experience fields
-- (profiles already has update policy for auth.uid() = id)

-- Create function to handle "mark as tried" atomically
CREATE OR REPLACE FUNCTION public.mark_experience_tried(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE profiles
  SET experiences_completed_count = experiences_completed_count + 1,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING experiences_completed_count INTO v_new_count;

  IF v_new_count IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Award 5 mile marker points
  PERFORM award_mile_markers(p_user_id, 'experience_tried', 5, '{}'::jsonb);

  RETURN jsonb_build_object('success', true, 'count', v_new_count);
END;
$$;

-- Create function to update alignment streak
CREATE OR REPLACE FUNCTION public.update_alignment_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date date;
  v_today date := current_date;
  v_new_streak integer;
BEGIN
  SELECT last_spin_date, alignment_streak_count
  INTO v_last_date, v_new_streak
  FROM profiles
  WHERE id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < v_today - interval '1 day' THEN
    v_new_streak := 1;
  ELSIF v_last_date = v_today - interval '1 day' THEN
    v_new_streak := v_new_streak + 1;
  END IF;
  -- If v_last_date = v_today, streak stays the same

  UPDATE profiles
  SET alignment_streak_count = v_new_streak,
      last_spin_date = v_today,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'streak', v_new_streak);
END;
$$;
