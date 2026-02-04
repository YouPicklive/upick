import { Button } from '@/components/ui/button';
import { Preferences } from '@/types/game';
import { ArrowLeft, ArrowRight, Home, Trees, Cigarette, CigaretteOff, Sofa, Zap, HelpCircle } from 'lucide-react';

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
    { id: 'indoor' as const, label: 'Inside', icon: Home, description: 'Stay cozy indoors' },
    { id: 'outdoor' as const, label: 'Outside', icon: Trees, description: 'Fresh air vibes' },
    { id: 'both' as const, label: 'Either', icon: HelpCircle, description: 'Surprise me!' },
  ];

  const smokingOptions = [
    { id: 'yes' as const, label: 'Smoke-friendly', icon: Cigarette, description: 'Hookah, patio smoking, etc.' },
    { id: 'no' as const, label: 'Smoke-free', icon: CigaretteOff, description: 'No smoking areas' },
    { id: 'doesnt-matter' as const, label: "Don't care", icon: HelpCircle, description: 'Whatever works' },
  ];

  const vibeOptions = [
    { id: 'chill' as const, label: 'Chill', icon: Sofa, description: 'Relax & hang out' },
    { id: 'active' as const, label: 'Active', icon: Zap, description: 'Move around & do stuff' },
    { id: 'both' as const, label: 'Any vibe', icon: HelpCircle, description: 'Open to anything' },
  ];

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">Set Your Vibe ✨</h1>
          <p className="text-muted-foreground">A few quick questions to find your perfect spot</p>
        </div>

        {/* Location Preference */}
        <div className="gradient-card rounded-3xl p-6 shadow-card mb-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏠</span> Inside or Outside?
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {locationOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.location === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ location: option.id })}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-bold text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smoking Preference */}
        <div className="gradient-card rounded-3xl p-6 shadow-card mb-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚬</span> Smoking?
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {smokingOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.smoking === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ smoking: option.id })}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-bold text-sm text-center leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vibe Preference */}
        <div className="gradient-card rounded-3xl p-6 shadow-card mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Chill or Active?
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {vibeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.vibe === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onPreferencesChange({ vibe: option.id })}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 ${
                    isSelected
                      ? 'gradient-warm text-primary-foreground shadow-glow scale-105'
                      : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-bold text-sm">{option.label}</span>
                  <span className={`text-xs text-center leading-tight ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <Button variant="hero" size="xl" className="w-full" onClick={onStart}>
          Let's Go!
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
