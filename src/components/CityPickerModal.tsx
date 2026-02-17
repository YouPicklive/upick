import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Clock, Star, Search, X } from 'lucide-react';
import { CitySelection, POPULAR_CITIES } from '@/hooks/useSelectedCity';
import { useGeolocation } from '@/hooks/useGeolocation';

interface CityPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCity: (city: CitySelection) => void;
  onUseCurrentLocation: () => void;
  savedCities: CitySelection[];
  onRemoveSaved?: (label: string) => void;
}

// Extended searchable cities beyond just the popular ones
const ALL_CITIES: CitySelection[] = [
  ...POPULAR_CITIES,
  { name: 'Philadelphia', state: 'PA', label: 'Philadelphia, PA', latitude: 39.9526, longitude: -75.1652 },
  { name: 'Baltimore', state: 'MD', label: 'Baltimore, MD', latitude: 39.2904, longitude: -76.6122 },
  { name: 'Raleigh', state: 'NC', label: 'Raleigh, NC', latitude: 35.7796, longitude: -78.6382 },
  { name: 'Charlotte', state: 'NC', label: 'Charlotte, NC', latitude: 35.2271, longitude: -80.8431 },
  { name: 'Atlanta', state: 'GA', label: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880 },
  { name: 'Nashville', state: 'TN', label: 'Nashville, TN', latitude: 36.1627, longitude: -86.7816 },
  { name: 'Miami', state: 'FL', label: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
  { name: 'Chicago', state: 'IL', label: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
  { name: 'Los Angeles', state: 'CA', label: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
  { name: 'San Francisco', state: 'SF', label: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'Portland', state: 'OR', label: 'Portland, OR', latitude: 45.5152, longitude: -122.6784 },
  { name: 'Seattle', state: 'WA', label: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
  { name: 'Denver', state: 'CO', label: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
  { name: 'Boston', state: 'MA', label: 'Boston, MA', latitude: 42.3601, longitude: -71.0589 },
  { name: 'Williamsburg', state: 'VA', label: 'Williamsburg, VA', latitude: 37.2707, longitude: -76.7075 },
  { name: 'Hampton', state: 'VA', label: 'Hampton, VA', latitude: 37.0299, longitude: -76.3452 },
];

export function CityPickerModal({ open, onClose, onSelectCity, onUseCurrentLocation, savedCities, onRemoveSaved }: CityPickerModalProps) {
  const [search, setSearch] = useState('');
  const { coordinates } = useGeolocation();

  const filteredCities = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return ALL_CITIES.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.state && c.state.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [search]);

  const handleCurrentLocation = () => {
    onUseCurrentLocation();
    setSearch('');
  };

  const handleSelect = (city: CitySelection) => {
    onSelectCity(city);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSearch(''); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">Choose your city</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search city or ZIP code…"
            className="pl-9 pr-9"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results */}
        {search.trim() && (
          <div className="space-y-1 mt-2">
            {filteredCities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No cities found. Try a different search.</p>
            ) : (
              filteredCities.map(city => (
                <button
                  key={city.label}
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{city.label}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Quick actions (shown when not searching) */}
        {!search.trim() && (
          <div className="space-y-4 mt-1">
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
                    <div key={city.label} className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelect(city)}
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
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Popular Cities
              </p>
              <div className="space-y-1">
                {POPULAR_CITIES.map(city => (
                  <button
                    key={city.label}
                    onClick={() => handleSelect(city)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{city.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
