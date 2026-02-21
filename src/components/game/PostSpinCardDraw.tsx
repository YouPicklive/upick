import { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// ── Types ──

export interface DrawnCard {
  id: string;
  card_name: string;
  action_text: string;
  vibe_tag: string | null;
  category: string | null;
  card_number: number | null;
}

interface DeckInfo {
  id: string;
  name: string;
  tier: string;
  description: string | null;
}

interface PostSpinCardDrawProps {
  deckId: string;
  isPremium: boolean;
  ownedPacks: string[];
  canSaveFortunes: boolean;
  onSaveFortune?: (fortuneText: string, packId: string) => void;
  onCardRevealed?: (card: DrawnCard) => void;
  onUpgrade: () => void;
}

// ── Helpers ──

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/** Check if user can access a deck: free, or Plus subscriber, or owns it */
function canAccessDeck(
  deckTier: string,
  isPremium: boolean,
  ownedPacks: string[],
  deckId: string
): boolean {
  if (deckTier === 'free') return true;
  if (isPremium) return true;
  if (ownedPacks.includes(deckId)) return true;
  return false;
}

// ── Card Back (face-down) ──

function CardBack({
  index,
  disabled,
  onClick,
  reducedMotion,
}: {
  index: number;
  disabled: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  const animDelay = `${index * 150}ms`;

  return (
    <button
      role="option"
      aria-selected={false}
      aria-label={`Card ${index + 1}`}
      tabIndex={disabled ? -1 : 0}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onClick();
        }
      }}
      className={`
        relative w-[100px] h-[150px] sm:w-[110px] sm:h-[165px] rounded-2xl border-2 
        flex flex-col items-center justify-center
        transition-all duration-300 outline-none
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${
          disabled
            ? 'opacity-50 cursor-default border-border/30 bg-card/40'
            : 'cursor-pointer border-primary/30 bg-gradient-to-b from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.2)] hover:border-primary/50'
        }
      `}
    >
      {/* Breathing pulse overlay */}
      {!disabled && !reducedMotion && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
            animationDelay: animDelay,
            animationDuration: '3s',
          }}
        />
      )}

      {/* Center emblem */}
      <div className="w-14 h-14 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center mb-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary/50"
        >
          <path
            d="M12 2L14.09 8.26L20 9.27L15.5 13.14L16.91 19.02L12 16.27L7.09 19.02L8.5 13.14L4 9.27L9.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-medium tracking-widest uppercase">
        {disabled ? '' : 'Tap'}
      </span>
    </button>
  );
}

// ── Card Front (revealed) ──

function CardFront({ card, deckName }: { card: DrawnCard; deckName: string }) {
  return (
    <div className="w-[100px] h-[150px] sm:w-[110px] sm:h-[165px] rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-[hsl(var(--primary)/0.12)] via-[hsl(var(--accent)/0.06)] to-background shadow-[0_8px_32px_hsl(var(--primary)/0.15)] flex flex-col items-center justify-center p-3 text-center">
      <span className="text-2xl mb-1">🃏</span>
      <span className="font-display text-[11px] font-bold text-foreground leading-tight mb-1">
        {card.card_name}
      </span>
      {card.vibe_tag && (
        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {card.vibe_tag}
        </span>
      )}
    </div>
  );
}

// ── Flip Card Container ──

function FlipCard({
  index,
  card,
  deckName,
  isFlipped,
  isDisabled,
  onClick,
  reducedMotion,
}: {
  index: number;
  card: DrawnCard;
  deckName: string;
  isFlipped: boolean;
  isDisabled: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return (
      <div className="relative">
        {!isFlipped ? (
          <div className="animate-fade-in">
            <CardBack index={index} disabled={isDisabled} onClick={onClick} reducedMotion={reducedMotion} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <CardFront card={card} deckName={deckName} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <div
        className="relative transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Back face */}
        <div style={{ backfaceVisibility: 'hidden' }}>
          <CardBack index={index} disabled={isDisabled} onClick={onClick} reducedMotion={reducedMotion} />
        </div>
        {/* Front face */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardFront card={card} deckName={deckName} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export function PostSpinCardDraw({
  deckId,
  isPremium,
  ownedPacks,
  canSaveFortunes,
  onSaveFortune,
  onCardRevealed,
  onUpgrade,
}: PostSpinCardDrawProps) {
  const reducedMotion = useReducedMotion();

  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [fortuneSaved, setFortuneSaved] = useState(false);
  const [drawKey, setDrawKey] = useState(0);

  // Fetch deck info + cards
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setFlippedIndex(null);
    setFortuneSaved(false);
    setLocked(false);

    try {
      // 1. Get deck info
      const { data: deck, error: deckErr } = await supabase
        .from('card_decks')
        .select('id, name, tier, description')
        .eq('id', deckId)
        .eq('is_active', true)
        .maybeSingle();

      if (deckErr || !deck) {
        logger.error('Error fetching deck:', deckErr);
        setCards([]);
        setLoading(false);
        return;
      }

      setDeckInfo(deck as DeckInfo);

      // 2. Check access
      if (!canAccessDeck(deck.tier, isPremium, ownedPacks, deckId)) {
        setLocked(true);
        setCards([]);
        setLoading(false);
        return;
      }

      // 3. Get cards from deck
      const { data: deckCards, error: cardsErr } = await supabase
        .from('deck_cards')
        .select('id, card_name, action_text, vibe_tag, category, card_number')
        .eq('deck_id', deckId)
        .eq('is_active', true);

      if (cardsErr) {
        logger.error('Error fetching deck cards:', cardsErr);
        setCards([]);
        setLoading(false);
        return;
      }

      // Shuffle and pick 3
      const shuffled = [...(deckCards || [])].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 3) as DrawnCard[];
      setCards(picked);
    } catch (err) {
      logger.error('Error in PostSpinCardDraw:', err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckId, isPremium, ownedPacks, drawKey]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCardSelect = (index: number) => {
    if (flippedIndex !== null) return;
    setFlippedIndex(index);
    const selectedCard = cards[index];
    if (selectedCard) {
      onCardRevealed?.(selectedCard);
    }
  };

  const handleDrawAgain = () => {
    setDrawKey((prev) => prev + 1);
  };

  const handleSave = () => {
    if (!canSaveFortunes) {
      toast.info('Upgrade to Plus to save card draws', {
        action: { label: 'Upgrade', onClick: onUpgrade },
      });
      return;
    }
    if (fortuneSaved || flippedIndex === null) return;
    const card = cards[flippedIndex];
    if (card) {
      onSaveFortune?.(card.action_text, deckId);
      setFortuneSaved(true);
      toast.success('Card saved! ✨');
    }
  };

  const deckName = deckInfo?.name || 'Card Deck';

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40">
        <div className="text-center mb-4">
          <Skeleton className="h-5 w-28 mx-auto mb-1" />
          <Skeleton className="h-3 w-44 mx-auto" />
        </div>
        <div className="flex justify-center gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="w-[100px] h-[150px] sm:w-[110px] sm:h-[165px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Locked overlay
  if (locked && deckInfo) {
    const ctaLabel =
      deckInfo.tier === 'plus'
        ? 'Upgrade to Plus'
        : deckInfo.tier === 'paid'
        ? 'Unlock this deck'
        : 'Unlock this deck';

    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40 text-center">
        <div className="flex justify-center mb-3">
          <span className="text-4xl">🔒</span>
        </div>
        <h3 className="font-display text-base font-bold mb-1">{deckName}</h3>
        <p className="text-sm text-muted-foreground mb-4">Unlock this deck to draw cards.</p>
        <div className="flex justify-center gap-3 mb-4 opacity-40 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[80px] h-[120px] rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-accent/5 flex items-center justify-center"
            >
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>
        <Button variant="hero" size="sm" onClick={onUpgrade} className="w-full">
          {ctaLabel}
        </Button>
      </div>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40 text-center">
        <p className="text-sm text-muted-foreground">No cards available in this deck yet.</p>
      </div>
    );
  }

  const selectedCard = flippedIndex !== null ? cards[flippedIndex] : null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="font-display text-lg font-bold mb-0.5">Pick a card</h3>
        <p className="text-sm text-muted-foreground">Choose the card you feel drawn to…</p>
      </div>

      {/* Cards grid */}
      <div role="listbox" aria-label="Face-down cards" className="flex justify-center gap-4 mb-5">
        {cards.map((card, i) => (
          <FlipCard
            key={`${drawKey}-${i}`}
            index={i}
            card={card}
            deckName={deckName}
            isFlipped={flippedIndex === i}
            isDisabled={flippedIndex !== null && flippedIndex !== i}
            onClick={() => handleCardSelect(i)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Revealed card message */}
      {selectedCard && (
        <div className="animate-fade-in" role="status" aria-live="polite">
          <div className="bg-primary/6 rounded-xl p-4 border border-primary/15 mb-4">
            <p className="font-display text-sm font-bold text-foreground text-center mb-1">
              {selectedCard.card_name}
            </p>
            <p className="text-sm italic text-muted-foreground leading-relaxed text-center mb-2">
              "{selectedCard.action_text}"
            </p>
            {selectedCard.vibe_tag && (
              <div className="flex justify-center">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {selectedCard.vibe_tag}
                </span>
              </div>
            )}
            {deckId !== 'fools_journey' && (
              <p className="text-[10px] text-primary/70 font-medium mt-2 text-center">
                🃏 {deckName}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            {onSaveFortune && (
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  fortuneSaved
                    ? 'bg-primary/10 text-primary'
                    : canSaveFortunes
                    ? 'bg-secondary hover:bg-secondary/80 text-foreground'
                    : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${fortuneSaved ? 'fill-current' : ''}`} />
                {fortuneSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <button
              onClick={handleDrawAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Draw again
            </button>
          </div>
        </div>
      )}

      {!selectedCard && (
        <p className="text-center text-xs text-muted-foreground">Three cards await — choose one.</p>
      )}
    </div>
  );
}
