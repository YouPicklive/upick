
-- Vote sessions table
CREATE TABLE public.vote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_fingerprint TEXT NOT NULL,
  expected_voter_count INT NOT NULL DEFAULT 2,
  options_json JSONB NOT NULL,
  vibe_filters_json JSONB,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  finalize_mode TEXT NOT NULL DEFAULT 'host',
  winner_option_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vote_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read sessions (needed for join page)
CREATE POLICY "Sessions are publicly readable"
  ON public.vote_sessions FOR SELECT
  USING (true);

-- Anyone can create sessions
CREATE POLICY "Anyone can create sessions"
  ON public.vote_sessions FOR INSERT
  WITH CHECK (true);

-- Anyone can update sessions (host finalize - fingerprint checked in app)
CREATE POLICY "Anyone can update sessions"
  ON public.vote_sessions FOR UPDATE
  USING (true);

-- Session votes table
CREATE TABLE public.session_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.vote_sessions(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  selected_option_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_id, voter_fingerprint)
);

ALTER TABLE public.session_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes (for live tallying)
CREATE POLICY "Votes are publicly readable"
  ON public.session_votes FOR SELECT
  USING (true);

-- Anyone can insert votes (fingerprint uniqueness enforced by constraint)
CREATE POLICY "Anyone can cast a vote"
  ON public.session_votes FOR INSERT
  WITH CHECK (true);
