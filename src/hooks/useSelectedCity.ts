import { useState, useEffect, useCallback } from 'react';

export interface CitySelection {
  name: string;       // e.g. "Richmond"
  state?: string;     // e.g. "VA"
  label: string;      // e.g. "Richmond, VA"
  latitude?: number;
  longitude?: number;
}

export const POPULAR_CITIES: CitySelection[] = [
  { name: 'Richmond', state: 'VA', label: 'Richmond, VA', latitude: 37.5407, longitude: -77.4360 },
  { name: 'Norfolk', state: 'VA', label: 'Norfolk, VA', latitude: 36.8508, longitude: -76.2859 },
  { name: 'Washington', state: 'DC', label: 'Washington, DC', latitude: 38.9072, longitude: -77.0369 },
  { name: 'New York', state: 'NY', label: 'New York, NY', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Austin', state: 'TX', label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
  { name: 'Virginia Beach', state: 'VA', label: 'Virginia Beach, VA', latitude: 36.8529, longitude: -75.9780 },
  { name: 'Charlottesville', state: 'VA', label: 'Charlottesville, VA', latitude: 38.0293, longitude: -78.4767 },
];

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
  const [selectedCity, setSelectedCityState] = useState<CitySelection | null>(() =>
    loadFromStorage<CitySelection | null>(STORAGE_KEY, null)
  );
  const [savedCities, setSavedCitiesState] = useState<CitySelection[]>(() =>
    loadFromStorage<CitySelection[]>(SAVED_CITIES_KEY, [])
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Persist selected city
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

  const selectCity = useCallback((city: CitySelection) => {
    setSelectedCityState(city);
    // Auto-save to saved cities (deduplicate)
    setSavedCitiesState(prev => {
      if (prev.some(c => c.label === city.label)) return prev;
      return [city, ...prev].slice(0, 10);
    });
    setIsPickerOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setSelectedCityState(null);
    setIsPickerOpen(false);
  }, []);

  const removeSavedCity = useCallback((label: string) => {
    setSavedCitiesState(prev => prev.filter(c => c.label !== label));
  }, []);

  const openPicker = useCallback(() => setIsPickerOpen(true), []);
  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  return {
    selectedCity,
    savedCities,
    isPickerOpen,
    selectCity,
    clearCity,
    removeSavedCity,
    openPicker,
    closePicker,
  };
}
