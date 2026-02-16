import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserEntitlements } from './useUserEntitlements';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'youpick_freemium';
const FREE_DAILY_SPINS = 1; // Matches DB default
const FREE_MAX_DISTANCE = 'short-drive';

interface FreemiumData {
  lastSpinDate: string;
  spinsToday: number;
  isPremium: boolean;
  ownedPacks: string[];
}

const getToday = () => new Date().toISOString().split('T')[0];

const getStoredData = (): FreemiumData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as FreemiumData;
      if (data.lastSpinDate !== getToday()) {
        return { ...data, lastSpinDate: getToday(), spinsToday: 0 };
      }
      return { ...data, ownedPacks: data.ownedPacks || [] };
    }
  } catch (e) {
    console.error('Error reading freemium data:', e);
  }
  return { lastSpinDate: getToday(), spinsToday: 0, isPremium: false, ownedPacks: [] };
};

const saveData = (data: FreemiumData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving freemium data:', e);
  }
};

export interface SpinResult {
  allowed: boolean;
  reason: string;
  remaining?: number;
}

export function useFreemium() {
  const { user, isAuthenticated } = useAuth();
  const {
    isPremium: dbIsPremium,
    ownedPacks: dbOwnedPacks,
    upgradeToPremium: dbUpgradeToPremium,
    purchasePack: dbPurchasePack,
    tier,
    unlimitedSpins,
    spinsUsedToday,
    freeSpinLimitPerDay,
  } = useUserEntitlements();

  const [localData, setLocalData] = useState<FreemiumData>(getStoredData);

  useEffect(() => {
    const freshData = getStoredData();
    setLocalData(freshData);
    saveData(freshData);
  }, []);

  const isPremium = isAuthenticated ? dbIsPremium : localData.isPremium;
  const ownedPacks = isAuthenticated ? dbOwnedPacks : localData.ownedPacks;

  // Compute spins remaining
  const maxFreeSpins = isAuthenticated ? freeSpinLimitPerDay : FREE_DAILY_SPINS;
  const spinsToday = isAuthenticated ? spinsUsedToday : localData.spinsToday;
  const spinsRemaining = isPremium ? Infinity : Math.max(0, maxFreeSpins - spinsToday);
  const canSpin = isPremium || spinsRemaining > 0;

  /**
   * Consume a spin. For authenticated users, calls server-side RPC
   * which atomically checks and consumes. For guests, uses localStorage.
   */
  const useSpin = useCallback(async (): Promise<SpinResult> => {
    if (isAuthenticated && user) {
      // Server-side spin consumption
      try {
        const { data, error } = await supabase.rpc('check_and_consume_spin', {
          p_user_id: user.id,
        });

        if (error) {
          console.error('Spin RPC error:', error);
          return { allowed: false, reason: 'error' };
        }

        const result = data as any;
        return {
          allowed: result.allowed,
          reason: result.reason,
          remaining: result.remaining,
        };
      } catch (err) {
        console.error('Spin consumption failed:', err);
        return { allowed: false, reason: 'error' };
      }
    } else {
      // Guest: localStorage
      if (isPremium) return { allowed: true, reason: 'plus' };

      if (spinsRemaining > 0) {
        const newData = {
          ...localData,
          spinsToday: localData.spinsToday + 1,
          lastSpinDate: getToday(),
        };
        setLocalData(newData);
        saveData(newData);
        return { allowed: true, reason: 'free_remaining', remaining: spinsRemaining - 1 };
      }
      return { allowed: false, reason: 'limit_reached' };
    }
  }, [isAuthenticated, user, isPremium, localData, spinsRemaining]);

  const isDistanceAllowed = useCallback((distance: string): boolean => {
    if (isPremium) return true;
    const freeDistances = ['walking', 'short-drive'];
    return freeDistances.includes(distance);
  }, [isPremium]);

  const getPremiumDistances = () => ['road-trip', 'epic-adventure', 'any'];

  const isFortunePackAllowed = useCallback((pack: string): boolean => {
    if (isPremium) return true;
    if (pack === 'free') return true;
    return ownedPacks.includes(pack);
  }, [isPremium, ownedPacks]);

  const getPremiumFortunePacks = () => ['plus', 'love', 'career', 'unhinged', 'main_character'];
  const getPurchasablePacks = () => ['love', 'career', 'unhinged', 'main_character'];

  const purchasePack = useCallback(async (packId: string) => {
    if (isAuthenticated) {
      await dbPurchasePack(packId);
    } else {
      if (localData.ownedPacks.includes(packId)) return;
      const newData = { ...localData, ownedPacks: [...localData.ownedPacks, packId] };
      setLocalData(newData);
      saveData(newData);
    }
  }, [isAuthenticated, dbPurchasePack, localData]);

  const upgradeToPremium = useCallback(async () => {
    if (isAuthenticated) {
      await dbUpgradeToPremium();
    } else {
      const newData = { ...localData, isPremium: true };
      setLocalData(newData);
      saveData(newData);
    }
  }, [isAuthenticated, dbUpgradeToPremium, localData]);

  const resetToFree = useCallback(() => {
    const newData = { lastSpinDate: getToday(), spinsToday: 0, isPremium: false, ownedPacks: [] };
    setLocalData(newData);
    saveData(newData);
  }, []);

  return {
    isPremium,
    ownedPacks,
    spinsRemaining,
    spinsToday,
    maxFreeSpins,
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
