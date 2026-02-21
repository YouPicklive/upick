import { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw, Bookmark, Share2, X } from 'lucide-react';
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
  userId?: string | null;
  spinId?: string | null;
  onCardRevealed?: (card: DrawnCard) => void;
  onUpgrade: () => void;
  onShare?: (card: DrawnCard) => void;
  onClose?: () => void;
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

      <div className="w-14 h-14 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center mb-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary/50">
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

function CardFront({ card }: { card: DrawnCard }) {
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
  isFlipped,
  isDisabled,
  onClick,
  reducedMotion,
}: {
  index: number;
  card: DrawnCard;
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
            <CardFront card={card} />
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
        <div style={{ backfaceVisibility: 'hidden' }}>
          <CardBack index={index} disabled={isDisabled} onClick={onClick} reducedMotion={reducedMotion} />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardFront card={card} />
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
  userId,
  spinId,
  onCardRevealed,
  onUpgrade,
  onShare,
  onClose,
}: PostSpinCardDrawProps) {
  const reducedMotion = useReducedMotion();

  // State
  const [dealtCards, setDealtCards] = useState<DrawnCard[]>([]);
  const [chosenCard, setChosenCard] = useState<DrawnCard | null>(null);
  const [revealCardId, setRevealCardId] = useState<string | null>(null);
  const [isDeckLocked, setIsDeckLocked] = useState(false);
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardSaved, setCardSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawKey, setDrawKey] = useState(0);

  const effectiveDeckId = deckId || 'fools_journey';

  // Fetch deck info + deal cards
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setChosenCard(null);
    setRevealCardId(null);
    setCardSaved(false);
    setIsDeckLocked(false);

    try {
      // 1. Get deck info
      const { data: deck, error: deckErr } = await supabase
        .from('card_decks')
        .select('id, name, tier, description')
        .eq('id', effectiveDeckId)
        .eq('is_active', true)
        .maybeSingle();

      if (deckErr || !deck) {
        logger.error('Error fetching deck:', deckErr);
        setDealtCards([]);
        setLoading(false);
        return;
      }

      setDeckInfo(deck as DeckInfo);

      // 2. Determine access
      let hasAccess = false;
      if (deck.tier === 'free') {
        hasAccess = true;
      } else if (isPremium) {
        hasAccess = true;
      } else if (deck.tier === 'paid' && userId) {
        // Check user_deck_ownership
        const { data: ownership } = await supabase
          .from('user_deck_ownership')
          .select('deck_id')
          .eq('user_id', userId)
          .eq('deck_id', effectiveDeckId)
          .maybeSingle();
        if (ownership) hasAccess = true;
      }
      // Also check legacy ownedPacks array
      if (!hasAccess && ownedPacks.includes(effectiveDeckId)) {
        hasAccess = true;
      }

      if (!hasAccess) {
        setIsDeckLocked(true);
        setDealtCards([]);
        setLoading(false);
        return;
      }

      // 3. Fetch cards and deal 3
      const { data: deckCards, error: cardsErr } = await supabase
        .from('deck_cards')
        .select('id, card_name, action_text, vibe_tag, category, card_number')
        .eq('deck_id', effectiveDeckId)
        .eq('is_active', true);

      if (cardsErr) {
        logger.error('Error fetching deck cards:', cardsErr);
        setDealtCards([]);
        setLoading(false);
        return;
      }

      // Shuffle and pick 3
      const shuffled = [...(deckCards || [])].sort(() => Math.random() - 0.5);
      setDealtCards((shuffled.slice(0, 3) as DrawnCard[]) || []);
    } catch (err) {
      logger.error('Error in PostSpinCardDraw:', err);
      setDealtCards([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveDeckId, isPremium, ownedPacks, userId, drawKey]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCardSelect = (index: number) => {
    if (chosenCard) return; // already chosen
    const card = dealtCards[index];
    if (!card) return;
    setChosenCard(card);
    setRevealCardId(card.id);
    onCardRevealed?.(card);
  };

  const handleDrawAgain = () => {
    setDrawKey((prev) => prev + 1);
  };

  const handleSave = async () => {
    if (!userId) {
      toast.info('Sign in to save card draws');
      return;
    }
    if (cardSaved || !chosenCard || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('saved_card_draws').insert({
        user_id: userId,
        deck_id: effectiveDeckId,
        card_id: chosenCard.id,
        card_name: chosenCard.card_name,
        action_text: chosenCard.action_text,
        vibe_tag: chosenCard.vibe_tag,
        category: chosenCard.category,
        spin_id: spinId || null,
      });

      if (error) {
        logger.error('Error saving card draw:', error);
        toast.error('Could not save card');
      } else {
        setCardSaved(true);
        toast.success('Card saved! ✨');
      }
    } catch (err) {
      logger.error('Error saving card draw:', err);
      toast.error('Could not save card');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (chosenCard) {
      onShare?.(chosenCard);
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
  if (isDeckLocked && deckInfo) {
    const ctaLabel =
      deckInfo.tier === 'plus'
        ? 'Upgrade to Plus'
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
  if (dealtCards.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40 text-center">
        <p className="text-sm text-muted-foreground">No cards available in this deck yet.</p>
      </div>
    );
  }

  const flippedIndex = chosenCard ? dealtCards.findIndex((c) => c.id === chosenCard.id) : null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/40">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="font-display text-lg font-bold mb-0.5">Pick a card</h3>
        <p className="text-sm text-muted-foreground">Choose the card you feel drawn to…</p>
      </div>

      {/* Cards grid */}
      <div role="listbox" aria-label="Face-down cards" className="flex justify-center gap-4 mb-5">
        {dealtCards.map((card, i) => (
          <FlipCard
            key={`${drawKey}-${i}`}
            index={i}
            card={card}
            isFlipped={flippedIndex === i}
            isDisabled={chosenCard !== null && chosenCard.id !== card.id}
            onClick={() => handleCardSelect(i)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Revealed card message */}
      {chosenCard && (
        <div className="animate-fade-in" role="status" aria-live="polite">
          <div className="bg-primary/6 rounded-xl p-4 border border-primary/15 mb-4">
            <p className="font-display text-sm font-bold text-foreground text-center mb-1">
              {chosenCard.card_name}
            </p>
            <p className="text-sm italic text-muted-foreground leading-relaxed text-center mb-2">
              "{chosenCard.action_text}"
            </p>
            {chosenCard.vibe_tag && (
              <div className="flex justify-center">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {chosenCard.vibe_tag}
                </span>
              </div>
            )}
            {effectiveDeckId !== 'fools_journey' && (
              <p className="text-[10px] text-primary/70 font-medium mt-2 text-center">
                🃏 {deckName}
              </p>
            )}
          </div>

          {/* Action buttons: Save, Share, Close */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                cardSaved
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${cardSaved ? 'fill-current' : ''}`} />
              {cardSaved ? 'Saved' : saving ? 'Saving…' : 'Save'}
            </button>

            {onShare && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                <Share2 className="w-3 h-3" />
                Share
              </button>
            )}

            <button
              onClick={handleDrawAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Draw again
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {!chosenCard && (
        <p className="text-center text-xs text-muted-foreground">Three cards await — choose one.</p>
      )}
    </div>
  );
}
