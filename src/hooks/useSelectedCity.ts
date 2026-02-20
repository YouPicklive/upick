import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { clearPlacesCache } from './usePlacesSearch';

export interface CitySelection {
  id?: string;
  name: string;
  state?: string;
  label: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  country?: string;
  countryCode?: string;
  stateRegion?: string;
  stateRegionShort?: string;
}

export interface CityRecord {
  id: string;
  name: string;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  is_popular: boolean;
  timezone: string | null;
}

const STORAGE_KEY = 'youpick_selected_city';
const SAVED_CITIES_KEY = 'youpick_saved_cities';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useSelectedCity() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCityState] = useState<CitySelection | null>(() =>
    loadFromStorage<CitySelection | null>(STORAGE_KEY, null)
  );
  const [savedCities, setSavedCitiesState] = useState<CitySelection[]>(() =>
    loadFromStorage<CitySelection[]>(SAVED_CITIES_KEY, [])
  );
  const [allCities, setAllCities] = useState<CityRecord[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Fetch curated cities from database (for popular cities / fallback)
  useEffect(() => {
    supabase
      .from('cities' as any)
      .select('*')
      .order('is_popular', { ascending: false })
      .order('name')
      .then(({ data }) => {
        if (data) setAllCities(data as any as CityRecord[]);
      });
  }, []);

  // Load from profile for logged-in users
  useEffect(() => {
    if (!user || selectedCity) return;
    supabase
      .from('profiles' as any)
      .select('selected_city_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && (data as any).selected_city_id) {
          const cityId = (data as any).selected_city_id;
          const city = allCities.find(c => c.id === cityId);
          if (city) {
            const sel: CitySelection = {
              id: city.id,
              name: city.name,
              state: city.state || undefined,
              label: city.state ? `${city.name}, ${city.state}` : city.name,
              latitude: city.lat,
              longitude: city.lng,
            };
            setSelectedCityState(sel);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
          }
        }
      });
  }, [user, allCities, selectedCity]);

  // Persist selected city to localStorage
  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCity));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedCity]);

  // Persist saved cities
  useEffect(() => {
    localStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(savedCities));
  }, [savedCities]);

  const selectCity = useCallback(async (city: CitySelection) => {
    setSelectedCityState(city);
    clearPlacesCache();
    // Auto-save to recent cities
    setSavedCitiesState(prev => {
      const key = city.placeId || city.id || city.label;
      if (prev.some(c => (c.placeId || c.id || c.label) === key)) return prev;
      return [city, ...prev].slice(0, 10);
    });
    setIsPickerOpen(false);

    // Persist to profile for logged-in users
    if (user && city.id) {
      await supabase
        .from('profiles' as any)
        .update({ selected_city_id: city.id } as any)
        .eq('id', user.id);
    }
  }, [user]);

  const clearCity = useCallback(async () => {
    setSelectedCityState(null);
    clearPlacesCache();
    setIsPickerOpen(false);
    if (user) {
      await supabase
        .from('profiles' as any)
        .update({ selected_city_id: null } as any)
        .eq('id', user.id);
    }
  }, [user]);

  const removeSavedCity = useCallback((label: string) => {
    setSavedCitiesState(prev => prev.filter(c => c.label !== label));
  }, []);

  const openPicker = useCallback(() => setIsPickerOpen(true), []);
  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  // Helper: get popular cities from DB
  const popularCities = allCities.filter(c => c.is_popular).map(c => ({
    id: c.id,
    name: c.name,
    state: c.state || undefined,
    label: c.state ? `${c.name}, ${c.state}` : c.name,
    latitude: c.lat,
    longitude: c.lng,
  }));

  return {
    selectedCity,
    savedCities,
    allCities,
    popularCities,
    isPickerOpen,
    selectCity,
    clearCity,
    removeSavedCity,
    openPicker,
    closePicker,
  };
}
