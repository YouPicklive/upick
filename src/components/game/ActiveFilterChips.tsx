import { X, MapPin } from 'lucide-react';
import { VibeFilter } from '@/types/game';

const BUDGET_LABELS: Partial<Record<VibeFilter, string>> = {
  mid: '💸 Mid',
  treat: '💎 Splurge',
};

const DISTANCE_LABELS: Partial<Record<VibeFilter, string>> = {
  'short-drive': '5 mi',
  'city-wide': '10 mi',
  'any-distance': '25 mi',
  'explorer-50': '50 mi',
};

interface ActiveFilterChipsProps {
  radiusLabel: string;
  budgetFilters: VibeFilter[];
  onRadiusTap: () => void;
  onBudgetTap: () => void;
  onClearBudget: (filter: VibeFilter) => void;
}

export function ActiveFilterChips({
  radiusLabel,
  budgetFilters,
  onRadiusTap,
  onBudgetTap,
  onClearBudget,
}: ActiveFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-2">
      {/* Radius chip — always visible */}
      <button
        onClick={onRadiusTap}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border/40 transition-colors text-sm font-medium text-foreground"
      >
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
        {radiusLabel}
      </button>

      {/* Budget chips — only when selected, exclude 'cheap' (implicit from vibe) */}
      {budgetFilters.filter(f => f in BUDGET_LABELS).map((filter) => (
        <button
          key={filter}
          onClick={onBudgetTap}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors text-sm font-medium text-foreground group"
        >
          <span>{BUDGET_LABELS[filter]}</span>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearBudget(filter);
            }}
            className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
          </span>
        </button>
      ))}
    </div>
  );
}
