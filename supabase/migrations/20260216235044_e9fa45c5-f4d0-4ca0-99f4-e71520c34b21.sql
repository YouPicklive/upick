-- Table: saved_spins — full spin moment journal entries
CREATE TABLE public.saved_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_name text NOT NULL,
  place_id text,
  category text,
  fortune_text text,
  fortune_pack text,
  photo_url text,
  address text,
  latitude double precision,
  longitude double precision,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved spins"
  ON public.saved_spins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved spins"
  ON public.saved_spins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved spins"
  ON public.saved_spins FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved spins"
  ON public.saved_spins FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Public can read saved spins"
  ON public.saved_spins FOR SELECT
  USING (true);

-- Table: place_reviews — public reviews + private notes on places
CREATE TABLE public.place_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_name text NOT NULL,
  place_id text,
  rating smallint NOT NULL DEFAULT 5,
  content text,
  note text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
  ON public.place_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public can read public reviews"
  ON public.place_reviews FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own reviews"
  ON public.place_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.place_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON public.place_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Add note column to saved_activities
ALTER TABLE public.saved_activities ADD COLUMN IF NOT EXISTS note text;

-- Timestamp trigger for place_reviews
CREATE TRIGGER update_place_reviews_updated_at
  BEFORE UPDATE ON public.place_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();