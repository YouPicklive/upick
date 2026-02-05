import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useFreemium } from '@/hooks/useFreemium';
import { useAuth } from '@/hooks/useAuth';
import { useTrialSpin } from '@/hooks/useTrialSpin';
 import { useGeolocation } from '@/hooks/useGeolocation';
import { LandingScreen } from '@/components/game/LandingScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { PreferencesScreen } from '@/components/game/PreferencesScreen';
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

  const [showSpinLimit, setShowSpinLimit] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
 
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
      // Clean up URL
      searchParams.delete('pack_purchase');
      setSearchParams(searchParams, { replace: true });
    } else if (packPurchase === 'cancelled') {
      toast.info('Purchase cancelled', {
        description: 'No worries, you can try again anytime!',
        duration: 4000,
      });
      // Clean up URL
      searchParams.delete('pack_purchase');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Allow unauthenticated users if they can use trial OR are in the middle of a trial game
  const allowTrialAccess = canUseTrial || isTrialMode;
  
  // Redirect to auth if not logged in AND can't use trial
  if (!isAuthenticated && !allowTrialAccess) {
    return <Navigate to="/auth" replace />;
  }

  const handleStartGame = () => {
    if (!isAuthenticated) {
      // Trial mode - use the free trial spin
      markTrialUsed();
      setIsTrialMode(true);
      startGame();
      return;
    }

    if (canSpin) {
      const spinUsed = useSpin();
      if (spinUsed) {
        startGame();
      }
    } else {
      setShowSpinLimit(true);
    }
  };

  const handleUpgrade = () => {
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    setShowSpinLimit(false);
  };

  const handlePlayAgain = () => {
    // If trial mode ended, redirect to auth
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    resetGame();
  };

  if (state.mode === 'landing') {
    return (
      <>
        <LandingScreen 
          onStart={() => setMode('setup')} 
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

  if (state.mode === 'setup') {
    return (
      <SetupScreen
        playerCount={state.playerCount}
        category={state.category}
        onPlayerCountChange={setPlayerCount}
        onCategoryChange={setCategory}
        onContinue={() => setMode('preferences')}
        onBack={() => setMode('landing')}
      />
    );
  }

  if (state.mode === 'preferences') {
    return (
      <>
        <PreferencesScreen
          preferences={state.preferences}
          onPreferencesChange={setPreferences}
          onStart={handleStartGame}
          onBack={() => setMode('setup')}
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

  if (state.mode === 'results' && state.winner) {
    return (
      <ResultsScreen 
        winner={state.winner}
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
