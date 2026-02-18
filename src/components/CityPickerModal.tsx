import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Clock, Star, Search, X, Globe, ChevronRight, Loader2 } from 'lucide-react';
import { CitySelection, CityRecord } from '@/hooks/useSelectedCity';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';

interface CityPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCity: (city: CitySelection) => void;
  onUseCurrentLocation: () => void;
  savedCities: CitySelection[];
  popularCities: CitySelection[];
  allCities: CityRecord[];
  onRemoveSaved?: (label: string) => void;
}

type PickerMode = 'quick' | 'region';

interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface RegionCity {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export function CityPickerModal({ open, onClose, onSelectCity, onUseCurrentLocation, savedCities, popularCities, allCities, onRemoveSaved }: CityPickerModalProps) {
  const [mode, setMode] = useState<PickerMode>('quick');
  const [search, setSearch] = useState('');
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const { coordinates } = useGeolocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Region mode state
  const [countrySearch, setCountrySearch] = useState('');
  const [countryPredictions, setCountryPredictions] = useState<AutocompletePrediction[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code: string; placeId: string } | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [statePredictions, setStatePredictions] = useState<AutocompletePrediction[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; placeId: string } | null>(null);
  const [regionCities, setRegionCities] = useState<RegionCity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);
  const countryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Curated city search (fallback for local DB)
  const searchableCities: CitySelection[] = useMemo(() => {
    return allCities.map(c => ({
      id: c.id,
      name: c.name,
      state: c.state || undefined,
      label: c.state ? `${c.name}, ${c.state}` : c.name,
      latitude: c.lat,
      longitude: c.lng,
    }));
  }, [allCities]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setPredictions([]);
      setCountrySearch('');
      setCountryPredictions([]);
      setStateSearch('');
      setStatePredictions([]);
      setSelectedCountry(null);
      setSelectedState(null);
      setRegionCities([]);
      setRegionError(null);
      setMode('quick');
    }
  }, [open]);

  // ── Google Places Autocomplete (Quick Search) ──
  const searchCities = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setPredictions([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: { query, types: '(cities)' },
      });
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
      }
    } catch {
      // Fall through to curated search
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced city search
  useEffect(() => {
    if (mode !== 'quick') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(() => searchCities(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, mode, searchCities]);

  // Resolve place details when a prediction is selected
  const resolveAndSelect = useCallback(async (prediction: AutocompletePrediction) => {
    setIsResolvingPlace(true);
    try {
      const { data, error } = await supabase.functions.invoke('place-details', {
        body: { placeId: prediction.placeId },
      });
      if (!error && data?.location) {
        const loc = data.location;
        const city: CitySelection = {
          name: loc.city || prediction.mainText,
          state: loc.stateRegionShort || undefined,
          stateRegion: loc.stateRegion || undefined,
          country: loc.country || undefined,
          countryCode: loc.countryCode || undefined,
          label: prediction.description,
          latitude: loc.lat,
          longitude: loc.lng,
          placeId: loc.placeId,
        };
        onSelectCity(city);
      }
    } catch {
      // Fallback: use prediction info directly
      onSelectCity({
        name: prediction.mainText,
        label: prediction.description,
        placeId: prediction.placeId,
      });
    } finally {
      setIsResolvingPlace(false);
    }
  }, [onSelectCity]);

  // ── Region Mode: Country Autocomplete ──
  const searchCountries = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setCountryPredictions([]);
      return;
    }
    try {
      const { data } = await supabase.functions.invoke('places-autocomplete', {
        body: { query, types: 'country' },
      });
      if (data?.predictions) setCountryPredictions(data.predictions);
    } catch {}
  }, []);

  useEffect(() => {
    if (mode !== 'region') return;
    if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    if (countrySearch.trim().length < 2) {
      setCountryPredictions([]);
      return;
    }
    countryDebounceRef.current = setTimeout(() => searchCountries(countrySearch), 300);
    return () => { if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current); };
  }, [countrySearch, mode, searchCountries]);

  const handleSelectCountry = useCallback(async (prediction: AutocompletePrediction) => {
    // Get country code from place details
    try {
      const { data } = await supabase.functions.invoke('place-details', {
        body: { placeId: prediction.placeId },
      });
      if (data?.location) {
        setSelectedCountry({
          name: data.location.country || prediction.mainText,
          code: data.location.countryCode || '',
          placeId: prediction.placeId,
        });
      } else {
        setSelectedCountry({
          name: prediction.mainText,
          code: '',
          placeId: prediction.placeId,
        });
      }
    } catch {
      setSelectedCountry({
        name: prediction.mainText,
        code: '',
        placeId: prediction.placeId,
      });
    }
    setCountrySearch('');
    setCountryPredictions([]);
    setSelectedState(null);
    setRegionCities([]);
  }, []);

  // ── Region Mode: State/Region Autocomplete ──
  const searchStates = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setStatePredictions([]);
      return;
    }
    try {
      const body: any = { query, types: '(regions)' };
      if (selectedCountry?.code) {
        body.componentRestrictions = { country: selectedCountry.code };
      }
      const { data } = await supabase.functions.invoke('places-autocomplete', body);
      // Filter to administrative_area_level_1 types only
      if (data?.predictions) {
        setStatePredictions(
          data.predictions.filter((p: AutocompletePrediction) =>
            p.types.includes('administrative_area_level_1') ||
            p.types.includes('political')
          )
        );
      }
    } catch {}
  }, [selectedCountry]);

  useEffect(() => {
    if (mode !== 'region' || !selectedCountry) return;
    if (stateDebounceRef.current) clearTimeout(stateDebounceRef.current);
    if (stateSearch.trim().length < 2) {
      setStatePredictions([]);
      return;
    }
    stateDebounceRef.current = setTimeout(() => searchStates(stateSearch), 300);
    return () => { if (stateDebounceRef.current) clearTimeout(stateDebounceRef.current); };
  }, [stateSearch, mode, selectedCountry, searchStates]);

  const handleSelectState = useCallback(async (prediction: AutocompletePrediction) => {
    setSelectedState({ name: prediction.mainText, placeId: prediction.placeId });
    setStateSearch('');
    setStatePredictions([]);
    setRegionCities([]);
    setRegionError(null);

    // Fetch cities in this region
    setIsLoadingCities(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-cities-in-region', {
        body: {
          stateRegionName: prediction.mainText,
          countryName: selectedCountry?.name,
          countryCode: selectedCountry?.code,
        },
      });
      if (!error && data?.cities?.length > 0) {
        setRegionCities(data.cities);
      } else {
        setRegionError("Can't load city list for this region — use Quick Search instead.");
      }
    } catch {
      setRegionError("Can't load city list for this region — use Quick Search instead.");
    } finally {
      setIsLoadingCities(false);
    }
  }, [selectedCountry]);

  const handleSelectRegionCity = useCallback(async (city: RegionCity) => {
    setIsResolvingPlace(true);
    try {
      const { data } = await supabase.functions.invoke('place-details', {
        body: { placeId: city.placeId },
      });
      if (data?.location) {
        const loc = data.location;
        const selection: CitySelection = {
          name: loc.city || city.name,
          state: loc.stateRegionShort || undefined,
          stateRegion: loc.stateRegion || selectedState?.name,
          country: loc.country || selectedCountry?.name,
          countryCode: loc.countryCode || selectedCountry?.code,
          label: `${city.name}${loc.stateRegionShort ? `, ${loc.stateRegionShort}` : ''}${loc.country ? `, ${loc.country}` : ''}`,
          latitude: loc.lat || city.lat,
          longitude: loc.lng || city.lng,
          placeId: loc.placeId || city.placeId,
        };
        onSelectCity(selection);
      } else {
        onSelectCity({
          name: city.name,
          label: city.formattedAddress || city.name,
          latitude: city.lat,
          longitude: city.lng,
          placeId: city.placeId,
          stateRegion: selectedState?.name,
          country: selectedCountry?.name,
          countryCode: selectedCountry?.code,
        });
      }
    } catch {
      onSelectCity({
        name: city.name,
        label: city.formattedAddress || city.name,
        latitude: city.lat,
        longitude: city.lng,
        placeId: city.placeId,
      });
    } finally {
      setIsResolvingPlace(false);
    }
  }, [onSelectCity, selectedState, selectedCountry]);

  // Curated local fallback search
  const curatedResults = useMemo(() => {
    if (mode !== 'quick' || !search.trim() || predictions.length > 0) return [];
    const q = search.toLowerCase().trim();
    return searchableCities.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.state && c.state.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [search, predictions, searchableCities, mode]);

  const handleCurrentLocation = () => {
    onUseCurrentLocation();
    setSearch('');
  };

  const handleSelectCurated = (city: CitySelection) => {
    onSelectCity(city);
    setSearch('');
  };

  // Loading overlay for place resolution
  if (isResolvingPlace) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Setting your location…</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">Choose your location</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-secondary/60 p-1 gap-1 mt-1">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'quick'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick Search
          </button>
          <button
            onClick={() => setMode('region')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'region'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pick by Region
          </button>
        </div>

        {/* ── QUICK SEARCH MODE ── */}
        {mode === 'quick' && (
          <div className="space-y-3 mt-2">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search any city worldwide…"
                className="pl-9 pr-9"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPredictions([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Searching indicator */}
            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Searching…</span>
              </div>
            )}

            {/* Google Autocomplete Results */}
            {!isSearching && predictions.length > 0 && (
              <div className="space-y-1">
                {predictions.map(p => (
                  <button
                    key={p.placeId}
                    onClick={() => resolveAndSelect(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium block truncate">{p.mainText}</span>
                      {p.secondaryText && (
                        <span className="text-xs text-muted-foreground block truncate">{p.secondaryText}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Curated fallback results */}
            {!isSearching && predictions.length === 0 && curatedResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-1">From our database:</p>
                {curatedResults.map(city => (
                  <button
                    key={city.id || city.label}
                    onClick={() => handleSelectCurated(city)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{city.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!isSearching && search.trim().length >= 2 && predictions.length === 0 && curatedResults.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No cities found. Try a different search.</p>
            )}

            {/* Quick actions (shown when not searching) */}
            {!search.trim() && (
              <div className="space-y-4">
                {/* Use current location */}
                <button
                  onClick={handleCurrentLocation}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Use current location</p>
                    <p className="text-[11px] text-muted-foreground">
                      {coordinates ? 'GPS available' : 'Enable location access'}
                    </p>
                  </div>
                </button>

                {/* Saved cities */}
                {savedCities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent Cities
                    </p>
                    <div className="space-y-1">
                      {savedCities.map(city => (
                        <div key={city.placeId || city.id || city.label} className="flex items-center gap-1">
                          <button
                            onClick={() => handleSelectCurated(city)}
                            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                          >
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{city.label}</span>
                          </button>
                          {onRemoveSaved && (
                            <button
                              onClick={() => onRemoveSaved(city.label)}
                              className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular cities */}
                {popularCities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Star className="w-3 h-3" /> Popular Cities
                    </p>
                    <div className="space-y-1">
                      {popularCities.map(city => (
                        <button
                          key={city.id}
                          onClick={() => handleSelectCurated(city)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{city.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PICK BY REGION MODE ── */}
        {mode === 'region' && (
          <div className="space-y-4 mt-2">
            {/* Step 1: Country */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                1. Country
              </label>
              {selectedCountry ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium flex-1">{selectedCountry.name}</span>
                  <button
                    onClick={() => { setSelectedCountry(null); setSelectedState(null); setRegionCities([]); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search country…"
                    className="pl-9"
                    autoFocus
                  />
                </div>
              )}
              {/* Country predictions */}
              {countryPredictions.length > 0 && !selectedCountry && (
                <div className="space-y-1 mt-1">
                  {countryPredictions.map(p => (
                    <button
                      key={p.placeId}
                      onClick={() => handleSelectCountry(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{p.mainText}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: State/Region */}
            {selectedCountry && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  2. State / Region
                </label>
                {selectedState ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium flex-1">{selectedState.name}</span>
                    <button
                      onClick={() => { setSelectedState(null); setRegionCities([]); setRegionError(null); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={stateSearch}
                      onChange={e => setStateSearch(e.target.value)}
                      placeholder={`Search state/region in ${selectedCountry.name}…`}
                      className="pl-9"
                    />
                  </div>
                )}
                {/* State predictions */}
                {statePredictions.length > 0 && !selectedState && (
                  <div className="space-y-1 mt-1">
                    {statePredictions.map(p => (
                      <button
                        key={p.placeId}
                        onClick={() => handleSelectState(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{p.mainText}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: City List */}
            {selectedState && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  3. Pick a City
                </label>
                {isLoadingCities && (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading cities…</span>
                  </div>
                )}
                {regionError && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-3">{regionError}</p>
                    <button
                      onClick={() => setMode('quick')}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Switch to Quick Search →
                    </button>
                  </div>
                )}
                {!isLoadingCities && !regionError && regionCities.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {regionCities.map(city => (
                      <button
                        key={city.placeId}
                        onClick={() => handleSelectRegionCity(city)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{city.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fallback: Quick Search suggestion */}
            {!selectedCountry && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Not sure? Use{' '}
                  <button onClick={() => setMode('quick')} className="text-primary font-medium hover:underline">
                    Quick Search
                  </button>
                  {' '}to find any city instantly.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
