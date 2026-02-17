import { MapPin, ChevronDown } from 'lucide-react';

interface CityLabelProps {
  label: string;
  onClick: () => void;
}

export function CityLabel({ label, onClick }: CityLabelProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/50 transition-colors group"
    >
      <MapPin className="w-3.5 h-3.5 text-primary" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  );
}
