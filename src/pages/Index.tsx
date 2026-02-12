import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useFreemium } from '@/hooks/useFreemium';
import { useAuth } from '@/hooks/useAuth';
import { useTrialSpin } from '@/hooks/useTrialSpin';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';
import { LandingScreen } from '@/components/game/LandingScreen';
import { VibeScreen } from '@/components/game/VibeScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
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

  const { searchPlaces, isLoading: placesLoading } = usePlacesSearch();

  const [showSpinLimit, setShowSpinLimit] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [findingSpots, setFindingSpots] = useState(false);
 
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

    // Try to fetch real places if we have coordinates
    if (coordinates) {
      setFindingSpots(true);
      try {
        const realSpots = await searchPlaces(coordinates, state.vibeInput);
        setFindingSpots(false);
        if (realSpots.length >= 4) {
          startGame(realSpots);
          return;
        }
      } catch {
        setFindingSpots(false);
      }
    }

    // Fallback to sample spots
    startGame();
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
    resetGame();
  };

  // Finding spots loading state
  if (findingSpots) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-lg font-medium text-foreground">Finding spots near you...</p>
        <p className="text-sm text-muted-foreground">Searching for the best options</p>
      </div>
    );
  }

  // Landing
  if (state.mode === 'landing') {
    return (
      <>
        <LandingScreen 
          onSoloStart={handleSoloStart}
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

  // Playing
  if (state.mode === 'playing' && currentSpot) {
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
    const winner = state.winner;
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
