import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserEntitlements } from './useUserEntitlements';

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
  const { isAuthenticated } = useAuth();
  const { 
    isPremium: dbIsPremium, 
    ownedPacks: dbOwnedPacks, 
    upgradeToPremium: dbUpgradeToPremium,
    purchasePack: dbPurchasePack,
  } = useUserEntitlements();

  const [localData, setLocalData] = useState<FreemiumData>(getStoredData);

  // Sync with localStorage on mount and handle day changes
  useEffect(() => {
    const freshData = getStoredData();
    setLocalData(freshData);
    saveData(freshData);
  }, []);

  // Use DB values when authenticated, localStorage when not
  const isPremium = isAuthenticated ? dbIsPremium : localData.isPremium;
  const ownedPacks = isAuthenticated ? dbOwnedPacks : localData.ownedPacks;

  const spinsRemaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_SPINS - localData.spinsToday);
  const canSpin = isPremium || spinsRemaining > 0;

  const useSpin = useCallback(() => {
    if (isPremium) return true;
    
    if (spinsRemaining > 0) {
      const newData = {
        ...localData,
        spinsToday: localData.spinsToday + 1,
        lastSpinDate: getToday(),
      };
      setLocalData(newData);
      saveData(newData);
      return true;
    }
    return false;
  }, [isPremium, localData, spinsRemaining]);

  const isDistanceAllowed = useCallback((distance: string): boolean => {
    if (isPremium) return true;
    
    // Free users can only use walking and short-drive
    const freeDistances = ['walking', 'short-drive'];
    return freeDistances.includes(distance);
  }, [isPremium]);

  const getPremiumDistances = () => ['road-trip', 'epic-adventure', 'any'];

  // Check if a fortune pack is unlocked (owned individually or has Plus)
  const isFortunePackAllowed = useCallback((pack: string): boolean => {
    if (isPremium) return true;
    if (pack === 'free') return true;
    // Check if pack is individually owned
    return ownedPacks.includes(pack);
  }, [isPremium, ownedPacks]);

  // Packs that require Plus OR individual purchase
  const getPremiumFortunePacks = () => ['plus', 'love', 'career', 'unhinged', 'main_character'];

  // Packs available for individual purchase
  const getPurchasablePacks = () => ['love', 'career', 'unhinged', 'main_character'];

  // Purchase a pack (add to ownedPacks)
  const purchasePack = useCallback(async (packId: string) => {
    if (isAuthenticated) {
      // Save to database
      await dbPurchasePack(packId);
    } else {
      // Save to localStorage
      if (localData.ownedPacks.includes(packId)) return;
      
      const newData = {
        ...localData,
        ownedPacks: [...localData.ownedPacks, packId],
      };
      setLocalData(newData);
      saveData(newData);
    }
  }, [isAuthenticated, dbPurchasePack, localData]);

  const upgradeToPremium = useCallback(async () => {
    if (isAuthenticated) {
      // Save to database
      await dbUpgradeToPremium();
    } else {
      // Save to localStorage
      const newData = { ...localData, isPremium: true };
      setLocalData(newData);
      saveData(newData);
    }
  }, [isAuthenticated, dbUpgradeToPremium, localData]);

  // For testing: reset to free
  const resetToFree = useCallback(() => {
    const newData = {
      lastSpinDate: getToday(),
      spinsToday: 0,
      isPremium: false,
      ownedPacks: [],
    };
    setLocalData(newData);
    saveData(newData);
  }, []);

  return {
    isPremium,
    ownedPacks,
    spinsRemaining,
    spinsToday: localData.spinsToday,
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
