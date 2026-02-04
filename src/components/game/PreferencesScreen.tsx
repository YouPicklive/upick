import { Button } from '@/components/ui/button';
import { Preferences } from '@/types/game';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  const locationOptions = [
    { id: 'indoor' as const, emoji: '🏠', label: 'Inside', description: 'Stay cozy indoors' },
    { id: 'outdoor' as const, emoji: '🌳', label: 'Outside', description: 'Fresh air vibes' },
    { id: 'both' as const, emoji: '🤷', label: 'Either', description: 'Surprise me!' },
  ];

  const smokingOptions = [
    { id: 'yes' as const, emoji: '🚬', label: 'Smoke-friendly', description: 'Hookah, patio, etc.' },
    { id: 'no' as const, emoji: '🚭', label: 'Smoke-free', description: 'Clean air only' },
    { id: 'doesnt-matter' as const, emoji: '🤷', label: "Don't care", description: 'Whatever works' },
  ];

  const vibeOptions = [
    { id: 'chill' as const, emoji: '🛋️', label: 'Chill', description: 'Relax & hang' },
    { id: 'active' as const, emoji: '🏃', label: 'Active', description: 'Move around!' },
    { id: 'both' as const, emoji: '🎭', label: 'Any vibe', description: 'Open to all' },
  ];

  const fancyOptions = [
    { id: 'fancy' as const, emoji: '✨', label: 'Fancy', description: 'Treat yourself!' },
    { id: 'divey' as const, emoji: '🍻', label: 'Divey', description: 'Keep it real' },
    { id: 'both' as const, emoji: '🎲', label: 'Whatever', description: 'Surprise me' },
  ];

  const distanceOptions = [
    { id: 'walking' as const, emoji: '🚶', label: 'Walking', description: '< 1 mile' },
    { id: 'short-drive' as const, emoji: '🚗', label: 'Short Drive', description: '1-5 miles' },
    { id: 'road-trip' as const, emoji: '🛣️', label: 'Road Trip', description: '5+ miles' },
    { id: 'any' as const, emoji: '🌍', label: 'Anywhere', description: 'No limit' },
  ];

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-start px-6 py-8 relative overflow-y-auto">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-24 left-8 text-4xl animate-float opacity-50">🌟</span>
        <span className="absolute top-40 right-12 text-3xl animate-float opacity-50" style={{ animationDelay: '0.6s' }}>🎨</span>
        <span className="absolute bottom-40 right-20 text-4xl animate-float opacity-50" style={{ animationDelay: '1.2s' }}>🌈</span>
      </div>

      <div className="w-full max-w-lg animate-slide-up relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <span className="text-5xl">✨</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Set Your Vibe</h1>
          <p className="text-muted-foreground">A few quick questions to find your perfect spot</p>
        </div>

        {/* Distance Preference - NEW */}
        <div className="gradient-card rounded-3xl p-5 shadow-card mb-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">📍</span> How far are you willing to go?
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {distanceOptions.map((option) => {
              const isSelected = preferences.distance === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ distance: option.id })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-bold text-xs">{option.label}</span>
                  <span className={`text-[10px] text-center leading-tight ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Preference */}
        <div className="gradient-card rounded-3xl p-5 shadow-card mb-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">🏠</span> Inside or Outside?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {locationOptions.map((option) => {
              const isSelected = preferences.location === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ location: option.id })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-bold text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smoking Preference */}
        <div className="gradient-card rounded-3xl p-5 shadow-card mb-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">💨</span> Smoking?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {smokingOptions.map((option) => {
              const isSelected = preferences.smoking === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ smoking: option.id })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-bold text-xs text-center leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vibe Preference */}
        <div className="gradient-card rounded-3xl p-5 shadow-card mb-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Chill or Active?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {vibeOptions.map((option) => {
              const isSelected = preferences.vibe === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ vibe: option.id })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-bold text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fancy/Divey Preference */}
        <div className="gradient-card rounded-3xl p-5 shadow-card mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">💎</span> Fancy or Divey?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {fancyOptions.map((option) => {
              const isSelected = preferences.fancy === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ fancy: option.id })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-bold text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <Button variant="hero" size="xl" className="w-full group mb-8" onClick={onStart}>
          <span className="text-2xl mr-2 group-hover:animate-bounce">🎲</span>
          Let's Go!
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
