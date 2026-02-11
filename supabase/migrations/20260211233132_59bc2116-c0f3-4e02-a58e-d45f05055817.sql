
-- Remove the overly permissive UPDATE policy
DROP POLICY "Anyone can update sessions" ON public.vote_sessions;

-- Create a server-side function to finalize vote sessions (host-only)
CREATE OR REPLACE FUNCTION public.finalize_vote_session(p_session_id uuid, p_caller_fingerprint text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_host text;
  session_status text;
  winner_id text;
BEGIN
  -- Get session info
  SELECT host_fingerprint, status INTO session_host, session_status
  FROM vote_sessions WHERE id = p_session_id;

  IF session_host IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF session_host != p_caller_fingerprint THEN
    RAISE EXCEPTION 'Only the host can finalize this session';
  END IF;

  IF session_status = 'closed' THEN
    RAISE EXCEPTION 'Session is already closed';
  END IF;

  -- Calculate winner from votes (random tie-break)
  SELECT selected_option_id INTO winner_id
  FROM session_votes
  WHERE session_votes.session_id = p_session_id
  GROUP BY selected_option_id
  ORDER BY COUNT(*) DESC, random()
  LIMIT 1;

  IF winner_id IS NULL THEN
    RAISE EXCEPTION 'No votes found';
  END IF;

  -- Update session
  UPDATE vote_sessions
  SET status = 'closed', winner_option_id = winner_id
  WHERE id = p_session_id;

  RETURN winner_id;
END;
$$;
