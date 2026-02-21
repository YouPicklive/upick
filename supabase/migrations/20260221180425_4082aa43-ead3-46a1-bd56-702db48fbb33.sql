
-- 1) Decks (packs)
CREATE TABLE IF NOT EXISTS public.card_decks (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  tier text NOT NULL DEFAULT 'free',
  price_cents int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validate tier values via trigger
CREATE OR REPLACE FUNCTION public.validate_card_deck_tier()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.tier NOT IN ('free', 'plus', 'paid') THEN
    RAISE EXCEPTION 'Invalid tier: %', NEW.tier;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_card_deck_tier
  BEFORE INSERT OR UPDATE ON public.card_decks
  FOR EACH ROW EXECUTE FUNCTION public.validate_card_deck_tier();

ALTER TABLE public.card_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active decks are publicly readable"
  ON public.card_decks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage decks"
  ON public.card_decks FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2) Cards inside decks
CREATE TABLE IF NOT EXISTS public.deck_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id text NOT NULL REFERENCES public.card_decks(id) ON DELETE CASCADE,
  card_name text NOT NULL,
  card_number int,
  arcana text NOT NULL DEFAULT 'major',
  suit text,
  action_text text NOT NULL,
  vibe_tag text,
  category text DEFAULT 'any',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON public.deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_active ON public.deck_cards(is_active);

-- Validate arcana values via trigger
CREATE OR REPLACE FUNCTION public.validate_deck_card_arcana()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.arcana NOT IN ('major', 'minor') THEN
    RAISE EXCEPTION 'Invalid arcana: %', NEW.arcana;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_deck_card_arcana
  BEFORE INSERT OR UPDATE ON public.deck_cards
  FOR EACH ROW EXECUTE FUNCTION public.validate_deck_card_arcana();

ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active cards are publicly readable"
  ON public.deck_cards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage cards"
  ON public.deck_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3) User deck ownership
CREATE TABLE IF NOT EXISTS public.user_deck_ownership (
  user_id uuid NOT NULL,
  deck_id text NOT NULL REFERENCES public.card_decks(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'purchase',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, deck_id)
);

ALTER TABLE public.user_deck_ownership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deck ownership"
  ON public.user_deck_ownership FOR SELECT
  USING (auth.uid() = user_id);

-- 4) Saved card draws
CREATE TABLE IF NOT EXISTS public.saved_card_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deck_id text NOT NULL REFERENCES public.card_decks(id),
  card_id uuid NOT NULL REFERENCES public.deck_cards(id),
  card_name text NOT NULL,
  action_text text NOT NULL,
  vibe_tag text,
  category text,
  spin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_draws_user ON public.saved_card_draws(user_id, created_at DESC);

ALTER TABLE public.saved_card_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved draws"
  ON public.saved_card_draws FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved draws"
  ON public.saved_card_draws FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved draws"
  ON public.saved_card_draws FOR DELETE
  USING (auth.uid() = user_id);
