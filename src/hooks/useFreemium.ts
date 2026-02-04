import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'youpick_freemium';
const FREE_DAILY_SPINS = 2;
const FREE_MAX_DISTANCE = 'short-drive'; // Free users limited to 5 miles max

interface FreemiumData {
  lastSpinDate: string;
  spinsToday: number;
  isPremium: boolean;
  ownedPacks: string[]; // Array of purchased pack IDs
}

const getToday = () => new Date().toISOString().split('T')[0];

const getStoredData = (): FreemiumData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as FreemiumData;
      // Reset spins if it's a new day
      if (data.lastSpinDate !== getToday()) {
        return {
          ...data,
          lastSpinDate: getToday(),
          spinsToday: 0,
        };
      }
      // Ensure ownedPacks exists for backward compatibility
      return {
        ...data,
        ownedPacks: data.ownedPacks || [],
      };
    }
  } catch (e) {
    console.error('Error reading freemium data:', e);
  }
  
  return {
    lastSpinDate: getToday(),
    spinsToday: 0,
    isPremium: false,
    ownedPacks: [],
  };
};

const saveData = (data: FreemiumData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving freemium data:', e);
  }
};

export function useFreemium() {
  const [data, setData] = useState<FreemiumData>(getStoredData);

  // Sync with localStorage on mount and handle day changes
  useEffect(() => {
    const freshData = getStoredData();
    setData(freshData);
    saveData(freshData);
  }, []);

  const spinsRemaining = data.isPremium ? Infinity : Math.max(0, FREE_DAILY_SPINS - data.spinsToday);
  const canSpin = data.isPremium || spinsRemaining > 0;

  const useSpin = useCallback(() => {
    if (data.isPremium) return true;
    
    if (spinsRemaining > 0) {
      const newData = {
        ...data,
        spinsToday: data.spinsToday + 1,
        lastSpinDate: getToday(),
      };
      setData(newData);
      saveData(newData);
      return true;
    }
    return false;
  }, [data, spinsRemaining]);

  const isDistanceAllowed = useCallback((distance: string): boolean => {
    if (data.isPremium) return true;
    
    // Free users can only use walking and short-drive
    const freeDistances = ['walking', 'short-drive'];
    return freeDistances.includes(distance);
  }, [data.isPremium]);

  const getPremiumDistances = () => ['road-trip', 'epic-adventure', 'any'];

  // Check if a fortune pack is unlocked (owned individually or has Plus)
  const isFortunePackAllowed = useCallback((pack: string): boolean => {
    if (data.isPremium) return true;
    if (pack === 'free') return true;
    // Check if pack is individually owned
    return data.ownedPacks.includes(pack);
  }, [data.isPremium, data.ownedPacks]);

  // Packs that require Plus OR individual purchase
  const getPremiumFortunePacks = () => ['plus', 'love', 'career', 'unhinged', 'main_character'];

  // Packs available for individual purchase
  const getPurchasablePacks = () => ['love', 'career', 'unhinged', 'main_character'];

  // Purchase a pack (add to ownedPacks)
  const purchasePack = useCallback((packId: string) => {
    if (data.ownedPacks.includes(packId)) return; // Already owned
    
    const newData = {
      ...data,
      ownedPacks: [...data.ownedPacks, packId],
    };
    setData(newData);
    saveData(newData);
  }, [data]);

  const upgradeToPremium = useCallback(() => {
    const newData = { ...data, isPremium: true };
    setData(newData);
    saveData(newData);
  }, [data]);

  // For testing: reset to free
  const resetToFree = useCallback(() => {
    const newData = {
      lastSpinDate: getToday(),
      spinsToday: 0,
      isPremium: false,
      ownedPacks: [],
    };
    setData(newData);
    saveData(newData);
  }, []);

  return {
    isPremium: data.isPremium,
    ownedPacks: data.ownedPacks,
    spinsRemaining,
    spinsToday: data.spinsToday,
    maxFreeSpins: FREE_DAILY_SPINS,
    canSpin,
    useSpin,
    isDistanceAllowed,
    getPremiumDistances,
    isFortunePackAllowed,
    getPremiumFortunePacks,
    getPurchasablePacks,
    purchasePack,
    freeMaxDistance: FREE_MAX_DISTANCE,
    upgradeToPremium,
    resetToFree,
  };
}
