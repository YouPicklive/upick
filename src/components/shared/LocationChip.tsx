import { MapPin, Navigation, X } from 'lucide-react';

interface LocationChipProps {
  label: string;
  isOverride: boolean;
  onClear: () => void;
}

/**
 * Compact location indicator with clear action for manual city override.
 */
export function LocationChip({ label, isOverride, onClear }: LocationChipProps) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {isOverride ? <MapPin className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
        {label}
      </span>
      {isOverride && (
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
          title="Return to current location"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
