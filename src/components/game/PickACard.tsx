import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';

export type ArchetypeKey = 'sun' | 'fool' | 'empress' | 'magician' | 'hermit' | 'wheel';

export interface Archetype {
  key: ArchetypeKey;
  name: string;
  symbol: string;
  prompt: string;
  subtext: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    key: 'sun',
    name: 'The Sun',
    symbol: '☀️',
    prompt: 'Joy. Visibility.',
    subtext: 'Go somewhere that feels alive.',
  },
  {
    key: 'fool',
    name: 'The Fool',
    symbol: '🌀',
    prompt: 'Try something unexpected.',
    subtext: 'The best adventures start with a leap.',
  },
  {
    key: 'empress',
    name: 'The Empress',
    symbol: '🌹',
    prompt: 'Indulge. Choose beauty.',
    subtext: 'You deserve something that feels good.',
  },
  {
    key: 'magician',
    name: 'The Magician',
    symbol: '✨',
    prompt: 'Make the night memorable.',
    subtext: 'You have the power to create magic here.',
  },
  {
    key: 'hermit',
    name: 'The Hermit',
    symbol: '🕯️',
    prompt: 'Quiet energy. Intentional space.',
    subtext: 'Stillness is its own kind of power.',
  },
  {
    key: 'wheel',
    name: 'The Wheel',
    symbol: '🎡',
    prompt: 'Let fate decide.',
    subtext: "Trust the algorithm. It knows what you need.",
  },
];

/**
 * Apply archetype ranking weights to an existing spot pool.
 * Does NOT change category/budget — only re-ranks within what's already filtered.
 */
export function applyArchetypeRanking(spots: Spot[], archetype: ArchetypeKey): Spot[] {
  const scored = spots.map((spot) => {
    let score = spot.rating ?? 3;

    switch (archetype) {
      case 'sun':
        // High-rated, vibrant, social
        if (spot.rating >= 4.5) score += 2;
        if (['moderate', 'active', 'dancing'].includes(spot.vibeLevel)) score += 1.5;
        if (spot.tags.some(t => ['Social', 'Lively', 'Group', 'Party', 'Dance Floor'].includes(t))) score += 1;
        break;

      case 'fool':
        // Pure randomness — add noise
        score += Math.random() * 4;
        break;

      case 'empress':
        // Aesthetic, upscale, cozy
        if (spot.priceLevel >= 3) score += 2;
        if (spot.vibeLevel === 'chill') score += 1;
        if (spot.tags.some(t => ['Romantic', 'Cozy', 'Upscale', 'Intimate', 'Fine Dining', 'Wine', 'Instagram-worthy'].includes(t))) score += 1.5;
        break;

      case 'magician':
        // Interactive experiences, events, activities
        if (['activity', 'event', 'nightlife'].includes(spot.category)) score += 2;
        if (['active', 'dancing'].includes(spot.vibeLevel)) score += 1.5;
        if (spot.tags.some(t => ['Interactive', 'Live Music', 'Events', 'Workshop', 'Experience'].includes(t))) score += 1;
        break;

      case 'hermit':
        // Calm, intimate, low-noise
        if (['chill', 'lazy'].includes(spot.vibeLevel)) score += 2;
        if (['cafe', 'wellness'].includes(spot.category)) score += 1.5;
        if (spot.tags.some(t => ['Quiet', 'Cozy', 'Intimate', 'Peaceful', 'Study Spot', 'Books'].includes(t))) score += 1;
        if (['active', 'dancing'].includes(spot.vibeLevel)) score -= 2;
        break;

      case 'wheel':
      default:
        // Pure algorithmic: keep natural rating order
        break;
    }

    return { spot, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.spot);
}

// ── Card face-down UI ──────────────────────────────────────────

interface CardItemProps {
  index: number;
  flipped: boolean;
  archetype: Archetype | null;
  onClick: () => void;
  disabled: boolean;
  revealed: boolean;
}

function CardItem({ index, flipped, archetype, onClick, disabled, revealed }: CardItemProps) {
  const delay = index * 80;

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: '900px' }}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Flip container */}
      <div
        className="relative transition-all duration-700 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionDelay: `${delay}ms`,
        }}
      >
        {/* Back face (shown by default) */}
        <div
          className={`w-24 h-36 sm:w-28 sm:h-44 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
            !flipped && !disabled
              ? 'border-primary/40 bg-gradient-to-b from-primary/10 to-accent/10 hover:border-primary/70 hover:shadow-glow hover:scale-105'
              : 'border-border/30 bg-card/60'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Card back pattern */}
          <div className="w-14 h-20 rounded-lg border border-primary/20 flex items-center justify-center opacity-60">
            <span className="text-2xl">✦</span>
          </div>
          {!flipped && !disabled && (
            <p className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wider uppercase">Tap</p>
          )}
        </div>

        {/* Front face (revealed) */}
        <div
          className="absolute inset-0 w-24 h-36 sm:w-28 sm:h-44 rounded-2xl flex flex-col items-center justify-center gap-2 p-3 border-2 border-primary/60 bg-gradient-to-b from-primary/15 via-accent/8 to-background shadow-glow"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-3xl">{archetype?.symbol}</span>
          <span className="font-display text-[11px] font-bold text-center text-foreground leading-tight">
            {archetype?.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main PickACard component ───────────────────────────────────

interface PickACardProps {
  isPremium: boolean;
  onArchetypeSelect: (archetype: ArchetypeKey) => void;
  onUpgradePlus: () => void;
}

export function PickACard({ isPremium, onArchetypeSelect, onUpgradePlus }: PickACardProps) {
  const [cards, setCards] = useState<(Archetype | null)[]>([null, null, null]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [mounted, setMounted] = useState(false);

  // Randomise 3 archetypes on mount
  useEffect(() => {
    const shuffled = [...ARCHETYPES].sort(() => Math.random() - 0.5).slice(0, 3);
    setCards(shuffled);
    setMounted(true);
  }, []);

  const handleCardTap = (index: number) => {
    if (flippedIndex !== null) return; // already picked
    if (!cards[index]) return;

    setFlippedIndex(index);
    setSelectedArchetype(cards[index]);
  };

  const handleConfirm = () => {
    if (selectedArchetype) {
      onArchetypeSelect(selectedArchetype.key);
    }
  };

  if (!isPremium) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40 text-center">
        <div className="flex justify-center mb-3">
          <span className="text-4xl">🃏</span>
        </div>
        <h3 className="font-display text-base font-bold mb-1">Pick a Card</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Draw a tarot archetype to shape the energy of your result.
        </p>
        <div className="flex justify-center gap-3 mb-4 opacity-50 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-16 h-24 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-primary/8 to-accent/8 flex items-center justify-center"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={onUpgradePlus}
          className="w-full"
        >
          Unlock with Plus
        </Button>
        <p className="text-[10px] text-muted-foreground mt-2">Plus members get full card access</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="font-display text-lg font-bold mb-0.5">Pick Your Card</h3>
        <p className="text-sm text-muted-foreground">Trust your instinct.</p>
      </div>

      {/* Cards */}
      <div
        className={`flex justify-center gap-4 mb-5 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {cards.map((archetype, i) => (
          <CardItem
            key={i}
            index={i}
            flipped={flippedIndex === i}
            archetype={archetype}
            onClick={() => handleCardTap(i)}
            disabled={flippedIndex !== null && flippedIndex !== i}
            revealed={flippedIndex === i}
          />
        ))}
      </div>

      {/* Reveal area */}
      {selectedArchetype && (
        <div className="animate-fade-in text-center mt-2 mb-4 px-2">
          <div className="bg-primary/8 rounded-xl p-4 border border-primary/20">
            <p className="font-semibold text-sm text-foreground mb-0.5">
              {selectedArchetype.prompt}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedArchetype.subtext}
            </p>
          </div>
          <Button
            variant="hero"
            size="lg"
            onClick={handleConfirm}
            className="w-full mt-3 group"
          >
            Continue with {selectedArchetype.name}
          </Button>
        </div>
      )}

      {!selectedArchetype && (
        <p className="text-center text-xs text-muted-foreground">
          Three cards await — choose one.
        </p>
      )}
    </div>
  );
}

