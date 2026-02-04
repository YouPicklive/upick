// Legacy file - fortunes are now fetched from the database
// This file is kept for backwards compatibility with any imports

export type FortunePack = 'free' | 'plus' | 'love' | 'career' | 'unhinged' | 'main_character';

// Re-export from the new hook for backwards compatibility
export { FORTUNE_PACKS, type FortunePackInfo } from '@/hooks/useFortunes';

// Deprecated: Use useFortunes hook instead
export const getRandomFortune = (_pack: FortunePack = 'free'): string => {
  console.warn('getRandomFortune is deprecated. Use useFortunes hook instead.');
  return "The universe has something special planned for you ✨";
};

export const getPremiumPacks = () => {
  console.warn('getPremiumPacks is deprecated. Use FORTUNE_PACKS from useFortunes instead.');
  return [];
};

export const getFreePacks = () => {
  console.warn('getFreePacks is deprecated. Use FORTUNE_PACKS from useFortunes instead.');
  return [];
};
