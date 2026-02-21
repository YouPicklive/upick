import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Preferences } from '@/types/game';
import { ArrowLeft, ArrowRight, Lock, Star, ShoppingBag } from 'lucide-react';
import { useFreemium } from '@/hooks/useFreemium';
import { FORTUNE_PACKS } from '@/hooks/useFortunes';
import { PackPurchaseModal } from './PackPurchaseModal';

interface PreferencesScreenProps {
  preferences: Preferences;
  onPreferencesChange: (preferences: Partial<Preferences>) => void;
  onStart: () => void;
  onBack: () => void;
}

export function PreferencesScreen({
  preferences,
  onPreferencesChange,
  onStart,
  onBack,
}: PreferencesScreenProps) {
  const {
    isPremium,
    ownedPacks,
    isDistanceAllowed,
    getPremiumDistances,
    isFortunePackAllowed,
    getPremiumFortunePacks,
    purchasePack,
    upgradeToPremium,
  } = useFreemium();

  const [showPackShop, setShowPackShop] = useState(false);

  const premiumDistances = getPremiumDistances();

  const handlePurchasePack = async (packId: string) => {
    await purchasePack(packId);
  };

  const handleUpgradePlus = () => {
    window.open('https://buy.stripe.com/cNifZg1UJejr45v6KX9R602', '_blank');
    setShowPackShop(false);
  };

  const locationOptions = [
    { id: 'indoor' as const, emoji: '🏠', label: 'Inside' },
    { id: 'outdoor' as const, emoji: '🌳', label: 'Outside' },
    { id: 'both' as const, emoji: '🤷', label: 'Either' },
  ];

  const smokingOptions = [
    { id: 'yes' as const, emoji: '🚬', label: 'Smoke-friendly' },
    { id: 'no' as const, emoji: '🚭', label: 'Smoke-free' },
    { id: 'doesnt-matter' as const, emoji: '🤷', label: "Don't care" },
  ];

  const vibeOptions = [
    { id: 'chill' as const, emoji: '🛋️', label: 'Chill' },
    { id: 'active' as const, emoji: '🏃', label: 'Active' },
    { id: 'dancing' as const, emoji: '💃', label: 'Dancing' },
    { id: 'lazy' as const, emoji: '😴', label: 'Lazy' },
    { id: 'both' as const, emoji: '🎭', label: 'Any' },
  ];

  const fancyOptions = [
    { id: 'fancy' as const, emoji: '✨', label: 'Fancy' },
    { id: 'divey' as const, emoji: '🍻', label: 'Divey' },
    { id: 'both' as const, emoji: '🎲', label: 'Whatever' },
  ];

  const distanceOptions = [
    { id: 'walking' as const, emoji: '🚶', label: 'Walking', sub: '< 1mi' },
    { id: 'short-drive' as const, emoji: '🚗', label: 'Short Drive', sub: '1-5mi' },
    { id: 'road-trip' as const, emoji: '🛣️', label: 'Road Trip', sub: '5-45mi' },
    { id: 'epic-adventure' as const, emoji: '🚀', label: 'Epic', sub: '45+mi' },
    { id: 'any' as const, emoji: '🌍', label: 'Any', sub: 'No limit' },
  ];

  const moodOptions = [
    { id: 'solo' as const, emoji: '🎧', label: 'Solo' },
    { id: 'date' as const, emoji: '💕', label: 'Date' },
    { id: 'squad' as const, emoji: '👯', label: 'Squad' },
    { id: 'chaotic' as const, emoji: '🤪', label: 'Chaotic' },
    { id: 'cozy' as const, emoji: '🧸', label: 'Cozy' },
    { id: 'any' as const, emoji: '🎲', label: 'Surprise me' },
  ];

  const budgetOptions = [
    { id: 'budget' as const, emoji: '💵', label: 'Budget', sub: '$' },
    { id: 'mid' as const, emoji: '💸', label: 'Mid', sub: '$$' },
    { id: 'splurge' as const, emoji: '💎', label: 'Splurge', sub: '$$$+' },
    { id: 'any' as const, emoji: '🤷', label: 'Any', sub: '' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Set your preferences</h1>
          <p className="text-muted-foreground text-sm">Fine-tune what you're looking for</p>
        </div>

        {/* Distance */}
        <PreferenceCard
          title="How far?"
          badge={!isPremium ? 'Plus' : undefined}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {distanceOptions.map((option) => {
              const isSelected = preferences.distance === option.id;
              const isLocked = !isPremium && premiumDistances.includes(option.id);
              return (
                <OptionButton
                  key={option.id}
                  emoji={option.emoji}
                  label={option.label}
                  sub={option.sub}
                  isSelected={isSelected}
                  isLocked={isLocked}
                  onClick={() => !isLocked && onPreferencesChange({ distance: option.id })}
                />
              );
            })}
          </div>
          {!isPremium && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Unlock more with <span className="text-primary font-medium">Plus</span>
            </p>
          )}
        </PreferenceCard>

        {/* Location */}
        <PreferenceCard title="Inside or outside?">
          <div className="grid grid-cols-3 gap-2">
            {locationOptions.map((option) => (
              <OptionButton
                key={option.id}
                emoji={option.emoji}
                label={option.label}
                isSelected={preferences.location === option.id}
                onClick={() => onPreferencesChange({ location: option.id })}
              />
            ))}
          </div>
        </PreferenceCard>

        {/* Smoking */}
        <PreferenceCard title="Smoking?">
          <div className="grid grid-cols-3 gap-2">
            {smokingOptions.map((option) => (
              <OptionButton
                key={option.id}
                emoji={option.emoji}
                label={option.label}
                isSelected={preferences.smoking === option.id}
                onClick={() => onPreferencesChange({ smoking: option.id })}
              />
            ))}
          </div>
        </PreferenceCard>

        {/* Vibe */}
        <PreferenceCard title="Energy level?">
          <div className="grid grid-cols-5 gap-1.5">
            {vibeOptions.map((option) => (
              <OptionButton
                key={option.id}
                emoji={option.emoji}
                label={option.label}
                isSelected={preferences.vibe === option.id}
                onClick={() => onPreferencesChange({ vibe: option.id })}
              />
            ))}
          </div>
        </PreferenceCard>

        {/* Mood */}
        <PreferenceCard title="What's the mood?">
          <div className="grid grid-cols-3 gap-2">
            {moodOptions.map((option) => (
              <OptionButton
                key={option.id}
                emoji={option.emoji}
                label={option.label}
                isSelected={preferences.mood === option.id}
                onClick={() => onPreferencesChange({ mood: option.id })}
              />
            ))}
          </div>
        </PreferenceCard>

        {/* Budget */}
        <PreferenceCard title="Budget?">
          <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="text-base">🆓</span>
              <span className="text-sm font-medium">Free only</span>
            </div>
            <Switch
              checked={preferences.freeOnly}
              onCheckedChange={(checked) => onPreferencesChange({ freeOnly: checked })}
            />
          </div>
          <div className={`grid grid-cols-4 gap-2 transition-opacity ${preferences.freeOnly ? 'opacity-40 pointer-events-none' : ''}`}>
            {budgetOptions.map((option) => (
              <OptionButton
                key={option.id}
                emoji={option.emoji}
                label={option.label}
                sub={option.sub}
                isSelected={preferences.budget === option.id}
                onClick={() => onPreferencesChange({ budget: option.id })}
              />
            ))}
          </div>
        </PreferenceCard>

        {/* Card Deck */}
        <PreferenceCard
          title="Card deck"
          action={
            <button
              onClick={() => setShowPackShop(true)}
              className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full flex items-center gap-1 hover:opacity-90 transition-opacity font-medium"
            >
              <ShoppingBag className="w-3 h-3" />
              Shop
            </button>
          }
        >
          <div className="grid grid-cols-6 gap-1.5">
            {FORTUNE_PACKS.map((pack) => {
              const isSelected = preferences.fortunePack === pack.id;
              const isUnlocked = pack.id === 'free' || isPremium || ownedPacks.includes(pack.id);
              const isLocked = !isUnlocked;
              const isPlusOnly = pack.id === 'plus';

              return (
                <button
                  key={pack.id}
                  onClick={() => {
                    if (!isLocked) {
                      onPreferencesChange({ fortunePack: pack.id as any });
                    } else {
                      setShowPackShop(true);
                    }
                  }}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 relative ${
                    isLocked
                      ? 'bg-secondary/50 opacity-50 cursor-pointer hover:opacity-70'
                      : isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {isLocked && (
                    <div className={`absolute -top-1 -right-1 ${isPlusOnly ? 'bg-primary' : 'bg-accent'} rounded-full p-0.5`}>
                      {isPlusOnly ? (
                        <Star className="w-2.5 h-2.5 text-primary-foreground" />
                      ) : (
                        <ShoppingBag className="w-2.5 h-2.5 text-accent-foreground" />
                      )}
                    </div>
                  )}
                  <span className="text-lg">{pack.emoji}</span>
                  <span className="font-medium text-[9px] text-center leading-tight">{pack.name}</span>
                </button>
              );
            })}
          </div>
          {!isPremium && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Tap locked decks to buy or <button onClick={() => setShowPackShop(true)} className="text-primary font-medium hover:underline">get Plus</button>
            </p>
          )}
        </PreferenceCard>

        {/* Start */}
        <Button variant="hero" size="xl" className="w-full group mb-8" onClick={onStart}>
          Let's Go
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Pack Purchase Modal */}
      {showPackShop && (
        <PackPurchaseModal
          ownedPacks={ownedPacks}
          isPremium={isPremium}
          onPurchase={handlePurchasePack}
          onUpgradePlus={handleUpgradePlus}
          onClose={() => setShowPackShop(false)}
        />
      )}
    </div>
  );
}

/* Reusable preference card */
function PreferenceCard({
  title,
  badge,
  action,
  children,
}: {
  title: string;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {badge && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Star className="w-3 h-3" />
            {badge}
          </span>
        )}
        {action}
      </div>
      {children}
    </div>
  );
}

/* Reusable option button */
function OptionButton({
  emoji,
  label,
  sub,
  isSelected,
  isLocked,
  onClick,
}: {
  emoji: string;
  label: string;
  sub?: string;
  isSelected: boolean;
  isLocked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 relative ${
        isLocked
          ? 'bg-secondary/40 opacity-50 cursor-not-allowed'
          : isSelected
          ? 'gradient-warm text-primary-foreground shadow-glow'
          : 'bg-secondary hover:bg-secondary/80'
      }`}
    >
      {isLocked && (
        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
          <Lock className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
      <span className="text-xl">{emoji}</span>
      <span className="font-semibold text-[10px] text-center leading-tight">{label}</span>
      {sub && (
        <span className={`text-[9px] text-center ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {sub}
        </span>
      )}
    </button>
  );
}