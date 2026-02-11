import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Spot } from '@/types/game';

const FINGERPRINT_KEY = 'youpick_voter_fingerprint';

export function getVoterFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

export interface VoteSession {
  id: string;
  host_fingerprint: string;
  expected_voter_count: number;
  options_json: Spot[];
  vibe_filters_json: any;
  location: string | null;
  status: 'open' | 'closed';
  finalize_mode: string;
  winner_option_id: string | null;
}

export interface VoteTally {
  [optionId: string]: number;
}

export function useVoteSession() {
  const [session, setSession] = useState<VoteSession | null>(null);
  const [voteTally, setVoteTally] = useState<VoteTally>({});
  const [totalVoters, setTotalVoters] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fingerprint = getVoterFingerprint();

  const createSession = useCallback(async (
    options: Spot[],
    expectedVoterCount: number,
    vibeFilters?: any,
    location?: string
  ): Promise<string | null> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vote_sessions')
      .insert({
        host_fingerprint: fingerprint,
        expected_voter_count: expectedVoterCount,
        options_json: options as any,
        vibe_filters_json: vibeFilters || null,
        location: location || null,
        status: 'open',
        finalize_mode: 'host',
      })
      .select('id')
      .single();

    setLoading(false);
    if (error || !data) {
      console.error('Failed to create vote session:', error);
      return null;
    }

    const sessionId = data.id;
    await loadSession(sessionId);
    return sessionId;
  }, [fingerprint]);

  const loadSession = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from('vote_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to load session:', error);
      return null;
    }

    const s: VoteSession = {
      ...data,
      options_json: data.options_json as unknown as Spot[],
      status: data.status as 'open' | 'closed',
    };
    setSession(s);

    // Check if current fingerprint has already voted
    const { data: existingVote } = await supabase
      .from('session_votes')
      .select('id')
      .eq('session_id', sessionId)
      .eq('voter_fingerprint', fingerprint)
      .maybeSingle();

    setHasVoted(!!existingVote);
    return s;
  }, [fingerprint]);

  const pollVotes = useCallback(async (sessionId: string) => {
    const { data: votes } = await supabase
      .from('session_votes')
      .select('selected_option_id, voter_fingerprint')
      .eq('session_id', sessionId);

    if (!votes) return;

    const tally: VoteTally = {};
    const uniqueVoters = new Set<string>();
    for (const v of votes) {
      tally[v.selected_option_id] = (tally[v.selected_option_id] || 0) + 1;
      uniqueVoters.add(v.voter_fingerprint);
    }
    setVoteTally(tally);
    setTotalVoters(uniqueVoters.size);

    // Also re-check session status
    const { data: sessionData } = await supabase
      .from('vote_sessions')
      .select('status, winner_option_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionData && sessionData.status === 'closed') {
      setSession(prev => prev ? { ...prev, status: 'closed', winner_option_id: sessionData.winner_option_id } : prev);
    }
  }, []);

  const startPolling = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollVotes(sessionId);
    pollRef.current = setInterval(() => pollVotes(sessionId), 3000);
  }, [pollVotes]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const castVote = useCallback(async (sessionId: string, optionId: string) => {
    const { error } = await supabase
      .from('session_votes')
      .insert({
        session_id: sessionId,
        voter_fingerprint: fingerprint,
        selected_option_id: optionId,
      });

    if (error) {
      if (error.code === '23505') {
        // Already voted
        setHasVoted(true);
        return true;
      }
      console.error('Failed to cast vote:', error);
      return false;
    }
    setHasVoted(true);
    return true;
  }, [fingerprint]);

  const finalize = useCallback(async (sessionId: string): Promise<Spot | null> => {
    // Get latest votes
    const { data: votes } = await supabase
      .from('session_votes')
      .select('selected_option_id')
      .eq('session_id', sessionId);

    if (!votes || votes.length === 0) return null;

    // Tally
    const tally: Record<string, number> = {};
    for (const v of votes) {
      tally[v.selected_option_id] = (tally[v.selected_option_id] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(tally));
    const topIds = Object.keys(tally).filter(k => tally[k] === maxCount);
    const winnerId = topIds[Math.floor(Math.random() * topIds.length)];

    // Update session
    await supabase
      .from('vote_sessions')
      .update({ status: 'closed', winner_option_id: winnerId })
      .eq('id', sessionId);

    // Find winner spot from options
    if (!session) return null;
    const winner = session.options_json.find(s => s.id === winnerId) || null;
    return winner;
  }, [session]);

  const isHost = session?.host_fingerprint === fingerprint;

  return {
    session,
    voteTally,
    totalVoters,
    hasVoted,
    isHost,
    loading,
    fingerprint,
    createSession,
    loadSession,
    castVote,
    finalize,
    startPolling,
    stopPolling,
  };
}
