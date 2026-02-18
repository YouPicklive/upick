import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useFreemium } from '@/hooks/useFreemium';
import { useAuth } from '@/hooks/useAuth';
import { useTrialSpin } from '@/hooks/useTrialSpin';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useSavedFortunes } from '@/hooks/useSavedFortunes';
import { useAutoPost } from '@/hooks/useAutoPost';
import { useSelectedCity } from '@/hooks/useSelectedCity';
import { LandingScreen } from '@/components/game/LandingScreen';
import { VibeScreen } from '@/components/game/VibeScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { SpinLimitModal } from '@/components/game/SpinLimitModal';

import { vibeToInternalMapping } from '@/types/game';
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
    dislikeSpot,
    resetGame,
  } = useGameState();

  const { 
    canSpin, 
    useSpin, 
    spinsToday, 
    maxFreeSpins, 
    spinsRemaining,
    isPremium,
    ownedPacks,
    upgradeToPremium 
  } = useFreemium();

  const { searchPlaces, isLoading: placesLoading } = usePlacesSearch();
  const { canSaveFortunes } = useUserEntitlements();
  const { saveFortune } = useSavedFortunes();
  const { postSpin, postSave } = useAutoPost();

  const [showSpinLimit, setShowSpinLimit] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [findingSpots, setFindingSpots] = useState(false);
 
  const { coordinates, isLoading: locationLoading, requestLocation } = useGeolocation();
  const { selectedCity } = useSelectedCity();

  // Derive effective coordinates: selectedCity > GPS > Richmond fallback
  const getSearchCoords = useCallback(() => {
    if (selectedCity?.latitude && selectedCity?.longitude) {
      return { latitude: selectedCity.latitude, longitude: selectedCity.longitude };
    }
    return coordinates || { latitude: 37.5407, longitude: -77.4360 };
  }, [selectedCity, coordinates]);
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

  const handleSoloStart = useCallback((selectedVibe?: string) => {
    // Enforce location selection before spinning
    if (!selectedCity) {
      toast.info('Pick a location first to start spinning!', { duration: 3000 });
      return;
    }
    if (!isAuthenticated) {
      markTrialUsed();
      setIsTrialMode(true);
    }
    if (selectedVibe) {
      setVibeInput({ selectedVibe: selectedVibe as any });
      // Auto-apply free filter when "Free & Beautiful" vibe is selected
      if (selectedVibe === 'free_beautiful' || selectedVibe === 'free-beautiful') {
        setVibeInput({ filters: ['cheap'] });
      }
    }
    setPlayerCount(1);
    setMode('vibe');
  }, [isAuthenticated, markTrialUsed, setPlayerCount, setMode, setVibeInput, selectedCity]);

  const handleVibeComplete = useCallback(async () => {
    // Server-enforced spin gating for authenticated users
    if (isAuthenticated) {
      const spinResult = await useSpin();
      if (!spinResult.allowed) {
        setShowSpinLimit(true);
        return;
      }
    }

    // Map selected vibe to internal intent/energy for backend compatibility
    if (state.vibeInput.selectedVibe) {
      const mapped = vibeToInternalMapping(state.vibeInput.selectedVibe);
      if (mapped.energy && !state.vibeInput.energy) {
        setVibeInput({ energy: mapped.energy as any });
      }
    }

    // Default vibe to 'explore' if none selected
    if (!state.vibeInput.selectedVibe) {
      setVibeInput({ selectedVibe: 'explore' });
    }

    // Determine coordinates: selectedCity > GPS > Richmond fallback
    const searchCoords = getSearchCoords();

    setFindingSpots(true);
    try {
      const realSpots = await searchPlaces(searchCoords, state.vibeInput);
      setFindingSpots(false);
      if (realSpots.length >= 4) {
        startGame(realSpots);
        return;
      }
    } catch {
      setFindingSpots(false);
    }

    // Fallback to sample spots
    startGame();
  }, [isAuthenticated, useSpin, state.vibeInput, getSearchCoords, searchPlaces, startGame, setVibeInput]);

  const handleUpgrade = useCallback(() => {
    navigate('/membership');
    setShowSpinLimit(false);
  }, [navigate]);

  const handlePlayAgain = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    resetGame();
  }, [isAuthenticated, navigate, resetGame]);

  // "Not For Me" — dislike and immediately re-spin
  const handleNotForMe = useCallback(async (spotId: string) => {
    dislikeSpot(spotId);
    toast.info('Got it — finding something better...', { duration: 2000 });
    
    // Re-spin with the same settings
    const searchCoords = getSearchCoords();
    setFindingSpots(true);
    try {
      const realSpots = await searchPlaces(searchCoords, state.vibeInput);
      setFindingSpots(false);
      if (realSpots.length >= 4) {
        startGame(realSpots);
        return;
      }
    } catch {
      setFindingSpots(false);
    }
    startGame();
  }, [getSearchCoords, state.vibeInput, searchPlaces, startGame, dislikeSpot]);

  // --- All hooks above, conditional returns below ---

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

  // Finding spots loading state
  if (findingSpots) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-lg font-medium text-foreground">Building your fate…</p>
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
          ownedPacks={ownedPacks}
          fortunePack={state.preferences.fortunePack}
          onFortunePackChange={(packId) => setPreferences({ fortunePack: packId as any })}
          activeFilters={state.vibeInput.filters}
          onClearFilter={(filter) => setVibeInput({ filters: state.vibeInput.filters.filter(f => f !== filter) })}
          onOpenPreferences={() => { setMode('vibe'); setVibeStep(1); }}
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

  // Quick Vibe flow: Category → Vibe → Budget
  if (state.mode === 'vibe') {
    return (
      <>
        <VibeScreen
          step={state.vibeStep}
          vibeInput={state.vibeInput}
          playerCount={state.playerCount}
          fortunePack={state.preferences.fortunePack}
          isPremium={isPremium}
          ownedPacks={ownedPacks}
          onStepChange={setVibeStep}
          onVibeChange={setVibeInput}
          onPlayerCountChange={setPlayerCount}
          onFortunePackChange={(packId) => setPreferences({ fortunePack: packId as any })}
          onStart={handleVibeComplete}
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
        onNotForMe={handleNotForMe}
        isTrialMode={!isAuthenticated}
        isAuthenticated={isAuthenticated}
        userCoordinates={coordinates}
        isPremium={isPremium}
        ownedPacks={ownedPacks}
        onFortunePackChange={(packId) => setPreferences({ fortunePack: packId as any })}
        canSaveFortunes={canSaveFortunes}
        onSaveFortune={(fortuneText, packId) => {
          saveFortune(fortuneText, packId);
          postSave({ name: winner.name, id: winner.id, category: winner.category });
        }}
        onPostToFeed={(shouldPost, caption) => {
          postSpin(winner, { shouldPost, caption });
        }}
      />
    );
  }

  return null;
};

export default Index;
