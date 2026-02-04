import { useState, useCallback } from 'react';
import { GameState, Spot, SAMPLE_SPOTS } from '@/types/game';

const initialState: GameState = {
  mode: 'landing',
  playerCount: 1,
  currentPlayer: 1,
  spots: [],
  remainingSpots: [],
  votes: {},
  winner: null,
  category: 'all',
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const setMode = useCallback((mode: GameState['mode']) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setPlayerCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, playerCount: count }));
  }, []);

  const setCategory = useCallback((category: GameState['category']) => {
    setState((prev) => ({ ...prev, category }));
  }, []);

  const startGame = useCallback(() => {
    const filteredSpots = state.category === 'all' 
      ? SAMPLE_SPOTS 
      : SAMPLE_SPOTS.filter((spot) => spot.category === state.category);
    
    // Shuffle spots
    const shuffled = [...filteredSpots].sort(() => Math.random() - 0.5);
    
    setState((prev) => ({
      ...prev,
      mode: 'playing',
      spots: shuffled,
      remainingSpots: shuffled,
      votes: shuffled.reduce((acc, spot) => ({ ...acc, [spot.id]: 0 }), {}),
      currentPlayer: 1,
      winner: null,
    }));
  }, [state.category]);

  const vote = useCallback((spotId: string, liked: boolean) => {
    setState((prev) => {
      const newVotes = { ...prev.votes };
      if (liked) {
        newVotes[spotId] = (newVotes[spotId] || 0) + 1;
      }

      const newRemainingSpots = prev.remainingSpots.slice(1);
      
      // Check if current player is done with their round
      const isRoundComplete = newRemainingSpots.length === 0;
      
      if (isRoundComplete) {
        // Find spots with most votes
        const maxVotes = Math.max(...Object.values(newVotes));
        const topSpots = prev.spots.filter((spot) => newVotes[spot.id] === maxVotes);
        
        if (topSpots.length === 1 || prev.currentPlayer >= prev.playerCount) {
          // We have a winner
          return {
            ...prev,
            votes: newVotes,
            remainingSpots: [],
            mode: 'results',
            winner: topSpots[Math.floor(Math.random() * topSpots.length)],
          };
        } else {
          // Next player's turn, but only show top spots
          return {
            ...prev,
            votes: Object.fromEntries(topSpots.map((s) => [s.id, 0])),
            remainingSpots: [...topSpots].sort(() => Math.random() - 0.5),
            spots: topSpots,
            currentPlayer: prev.currentPlayer + 1,
          };
        }
      }

      return {
        ...prev,
        votes: newVotes,
        remainingSpots: newRemainingSpots,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const currentSpot = state.remainingSpots[0] || null;
  const progress = state.spots.length > 0 
    ? ((state.spots.length - state.remainingSpots.length) / state.spots.length) * 100 
    : 0;

  return {
    state,
    currentSpot,
    progress,
    setMode,
    setPlayerCount,
    setCategory,
    startGame,
    vote,
    resetGame,
  };
}
