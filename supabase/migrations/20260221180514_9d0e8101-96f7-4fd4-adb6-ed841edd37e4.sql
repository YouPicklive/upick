
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Active decks are publicly readable" ON public.card_decks;
DROP POLICY IF EXISTS "read decks" ON public.card_decks;
CREATE POLICY "read decks"
  ON public.card_decks FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Active cards are publicly readable" ON public.deck_cards;
DROP POLICY IF EXISTS "read cards" ON public.deck_cards;
CREATE POLICY "read cards"
  ON public.deck_cards FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own deck ownership" ON public.user_deck_ownership;
DROP POLICY IF EXISTS "read own deck ownership" ON public.user_deck_ownership;
CREATE POLICY "read own deck ownership"
  ON public.user_deck_ownership FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own saved draws" ON public.saved_card_draws;
DROP POLICY IF EXISTS "Users can insert own saved draws" ON public.saved_card_draws;
DROP POLICY IF EXISTS "Users can delete own saved draws" ON public.saved_card_draws;
DROP POLICY IF EXISTS "read own saved draws" ON public.saved_card_draws;
DROP POLICY IF EXISTS "insert own saved draws" ON public.saved_card_draws;
DROP POLICY IF EXISTS "delete own saved draws" ON public.saved_card_draws;

CREATE POLICY "read own saved draws"
  ON public.saved_card_draws FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert own saved draws"
  ON public.saved_card_draws FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete own saved draws"
  ON public.saved_card_draws FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
