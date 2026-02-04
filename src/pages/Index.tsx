import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useFreemium } from '@/hooks/useFreemium';
import { LandingScreen } from '@/components/game/LandingScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { PreferencesScreen } from '@/components/game/PreferencesScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { SpinLimitModal } from '@/components/game/SpinLimitModal';

const Index = () => {
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

  const handleStartGame = () => {
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
    // In a real app, this would trigger Stripe checkout
    upgradeToPremium();
    setShowSpinLimit(false);
  };

  if (state.mode === 'landing') {
    return (
      <>
        <LandingScreen 
          onStart={() => setMode('setup')} 
          spinsRemaining={spinsRemaining}
          isPremium={isPremium}
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
        fortunePack={state.preferences.fortunePack}
        onPlayAgain={resetGame} 
      />
    );
  }

  return null;
};

export default Index;
