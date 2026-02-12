
-- Drop the finalize function first (depends on both tables)
DROP FUNCTION IF EXISTS public.finalize_vote_session(uuid, text);

-- Drop tables
DROP TABLE IF EXISTS public.session_votes;
DROP TABLE IF EXISTS public.vote_sessions;
