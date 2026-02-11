import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useFreemium } from '@/hooks/useFreemium';
import { useAuth } from '@/hooks/useAuth';
import { useTrialSpin } from '@/hooks/useTrialSpin';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoteSession } from '@/hooks/useVoteSession';
import { LandingScreen } from '@/components/game/LandingScreen';
import { VibeScreen } from '@/components/game/VibeScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { HostLobbyScreen } from '@/components/game/HostLobbyScreen';
import { SpinLimitModal } from '@/components/game/SpinLimitModal';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const { canUseTrial, useTrialSpin: markTrialUsed, hasUsedTrial } = useTrialSpin();
  
  const {
    state,
    currentSpot,
    progress,
    setMode,
    setVibeStep,
    setVibeInput,
    setPlayerCount,
    setCategory,
    setPreferences,
    startGame,
    vote,
    resetGame,
  } = useGameState();

  const { 
    canSpin, 
    useSpin, 
    spinsToday, 
    maxFreeSpins, 
    spinsRemaining,
    isPremium,
    upgradeToPremium 
  } = useFreemium();

  const voteSession = useVoteSession();

  const [showSpinLimit, setShowSpinLimit] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [groupSessionId, setGroupSessionId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [groupWinner, setGroupWinner] = useState<typeof state.winner>(null);
 
  // Initialize geolocation
  const { coordinates, isLoading: locationLoading, requestLocation } = useGeolocation();

  // Handle checkout success/cancelled query params
  useEffect(() => {
    const packPurchase = searchParams.get('pack_purchase');
    if (packPurchase === 'success') {
      toast.success('🎉 Pack purchased successfully!', {
        description: 'Your new fortune pack is now unlocked.',
        duration: 5000,
      });
      searchParams.delete('pack_purchase');
      setSearchParams(searchParams, { replace: true });
    } else if (packPurchase === 'cancelled') {
      toast.info('Purchase cancelled', {
        description: 'No worries, you can try again anytime!',
        duration: 4000,
      });
      searchParams.delete('pack_purchase');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Start polling when in group lobby
  useEffect(() => {
    if (state.mode === 'group-lobby' && groupSessionId) {
      voteSession.startPolling(groupSessionId);
      return () => voteSession.stopPolling();
    }
  }, [state.mode, groupSessionId]);

  // After startGame sets mode to 'playing', intercept for group mode
  useEffect(() => {
    if (state.mode === 'playing' && state.playerCount >= 2 && !groupSessionId) {
      const createSession = async () => {
        const sessionId = await voteSession.createSession(
          state.spots,
          state.playerCount,
          state.vibeInput,
          undefined
        );
        if (sessionId) {
          setGroupSessionId(sessionId);
          setMode('group-lobby');
          // Auto-open native share sheet
          const voteUrl = `${window.location.origin}/vote/${sessionId}`;
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'Join my Spin Sesh!',
                text: 'Help us decide — tap to vote!',
                url: voteUrl,
              });
            } catch {
              // User cancelled share — that's fine
            }
          }
        }
      };
      createSession();
    }
  }, [state.mode, state.playerCount, groupSessionId, state.spots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const allowTrialAccess = canUseTrial || isTrialMode;
  
  if (!isAuthenticated && !allowTrialAccess) {
    return <Navigate to="/auth" replace />;
  }

  const handleSoloStart = async () => {
    if (!isAuthenticated) {
      markTrialUsed();
      setIsTrialMode(true);
    }

    if (isAuthenticated && !canSpin) {
      setShowSpinLimit(true);
      return;
    }

    if (isAuthenticated) {
      useSpin();
    }

    setPlayerCount(1);
    startGame();
  };

  const handleSeshStart = async () => {
    if (!isAuthenticated) {
      markTrialUsed();
      setIsTrialMode(true);
    }

    if (isAuthenticated && !canSpin) {
      setShowSpinLimit(true);
      return;
    }

    if (isAuthenticated) {
      useSpin();
    }

    setPlayerCount(4); // Default group size for sesh
    startGame();
  };

  const handleFinalize = async () => {
    if (!groupSessionId) return;
    setFinalizing(true);
    const winner = await voteSession.finalize(groupSessionId);
    setFinalizing(false);
    if (winner) {
      // Manually set the winner and go to results
      // We need to update game state with the winner
      // Use a workaround: reset to results mode with the winner
      resetGame();
      // Re-start with the winner directly
      setMode('results');
      // We'll pass the winner through a ref-like state
      setGroupWinner(winner);
      setGroupSessionId(null);
    } else {
      toast.error('No votes to finalize');
    }
  };


  const handleUpgrade = () => {
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    setShowSpinLimit(false);
  };

  const handlePlayAgain = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setGroupSessionId(null);
    setGroupWinner(null);
    resetGame();
  };

  // Landing
  if (state.mode === 'landing') {
    return (
      <>
        <LandingScreen 
          onSoloStart={handleSoloStart}
          onSeshStart={handleSeshStart}
          spinsRemaining={isAuthenticated ? spinsRemaining : (canUseTrial ? 1 : 0)}
          isPremium={isPremium}
          isTrialMode={!isAuthenticated && canUseTrial}
        />
        {showSpinLimit && (
          <SpinLimitModal
            spinsToday={spinsToday}
            maxFreeSpins={maxFreeSpins}
            onUpgrade={handleUpgrade}
            onClose={() => setShowSpinLimit(false)}
          />
        )}
      </>
    );
  }

  // Quick Vibe flow (kept for future use but not in main flow)
  if (state.mode === 'vibe') {
    return (
      <>
        <VibeScreen
          step={state.vibeStep}
          vibeInput={state.vibeInput}
          playerCount={state.playerCount}
          fortunePack={state.preferences.fortunePack}
          isPremium={isPremium}
          onStepChange={setVibeStep}
          onVibeChange={setVibeInput}
          onPlayerCountChange={setPlayerCount}
          onFortunePackChange={(packId) => setPreferences({ fortunePack: packId as any })}
          onStart={handleSoloStart}
          onBack={() => setMode('landing')}
        />
        {showSpinLimit && (
          <SpinLimitModal
            spinsToday={spinsToday}
            maxFreeSpins={maxFreeSpins}
            onUpgrade={handleUpgrade}
            onClose={() => setShowSpinLimit(false)}
          />
        )}
      </>
    );
  }

  // Group Lobby
  if (state.mode === 'group-lobby' && groupSessionId) {
    return (
      <HostLobbyScreen
        sessionId={groupSessionId}
        expectedVoters={state.playerCount}
        currentVoters={voteSession.totalVoters}
        onFinalize={handleFinalize}
        finalizing={finalizing}
      />
    );
  }

  // Playing (solo only now)
  if (state.mode === 'playing' && currentSpot && state.playerCount === 1) {
    return (
      <PlayingScreen
        spot={currentSpot}
        progress={progress}
        currentPlayer={state.currentPlayer}
        totalPlayers={state.playerCount}
        onVote={(liked) => vote(currentSpot.id, liked)}
      />
    );
  }

  // Results
  if (state.mode === 'results') {
    const winner = groupWinner || state.winner;
    if (!winner) return null;
    return (
      <ResultsScreen 
        winner={winner}
        likedSpots={state.likedSpots}
        fortunePack={state.preferences.fortunePack}
        onPlayAgain={handlePlayAgain}
        isTrialMode={!isAuthenticated}
        userCoordinates={coordinates}
      />
    );
  }

  return null;
};

export default Index;
