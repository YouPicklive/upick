import { useGameState } from '@/hooks/useGameState';
import { LandingScreen } from '@/components/game/LandingScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { PreferencesScreen } from '@/components/game/PreferencesScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';

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

  if (state.mode === 'landing') {
    return <LandingScreen onStart={() => setMode('setup')} />;
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
      <PreferencesScreen
        preferences={state.preferences}
        onPreferencesChange={setPreferences}
        onStart={startGame}
        onBack={() => setMode('setup')}
      />
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
    return <ResultsScreen winner={state.winner} onPlayAgain={resetGame} />;
  }

  return null;
};

export default Index;
