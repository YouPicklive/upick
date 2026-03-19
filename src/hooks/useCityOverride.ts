import { useState, useCallback } from 'react';

const STORAGE_KEY = 'yp_city_override';

interface CityOverride {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Manual city override that persists in localStorage.
 * When set, this takes priority over GPS coordinates.
 * When cleared, the app returns to current-location behavior.
 */
export function useCityOverride() {
  const [override, setOverrideState] = useState<CityOverride | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setOverride = useCallback((city: CityOverride) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
    setOverrideState(city);
  }, []);

  const clearOverride = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrideState(null);
  }, []);

  return { override, setOverride, clearOverride };
}
