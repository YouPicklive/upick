import { useState } from 'react';

const categoryGradients: Record<string, string> = {
  restaurant: 'linear-gradient(135deg, hsl(20, 80%, 45%), hsl(35, 90%, 55%))',
  activity: 'linear-gradient(135deg, hsl(200, 70%, 45%), hsl(180, 60%, 50%))',
  bar: 'linear-gradient(135deg, hsl(270, 60%, 40%), hsl(290, 50%, 55%))',
  cafe: 'linear-gradient(135deg, hsl(30, 50%, 40%), hsl(40, 60%, 55%))',
  nightlife: 'linear-gradient(135deg, hsl(260, 70%, 30%), hsl(300, 60%, 45%))',
  wellness: 'linear-gradient(135deg, hsl(150, 50%, 40%), hsl(170, 60%, 55%))',
  brunch: 'linear-gradient(135deg, hsl(40, 80%, 50%), hsl(25, 70%, 55%))',
  lunch: 'linear-gradient(135deg, hsl(120, 40%, 40%), hsl(80, 50%, 50%))',
  dinner: 'linear-gradient(135deg, hsl(350, 60%, 40%), hsl(15, 70%, 50%))',
  desserts: 'linear-gradient(135deg, hsl(330, 60%, 50%), hsl(350, 70%, 60%))',
  'event-planning': 'linear-gradient(135deg, hsl(45, 80%, 45%), hsl(20, 70%, 50%))',
};

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
  brunch: '🥞',
  lunch: '🥗',
  dinner: '🍷',
  desserts: '🍰',
  'event-planning': '🎪',
};

interface SpotImageProps {
  src: string;
  alt: string;
  category: string;
  className?: string;
}

/**
 * Smart image component: attempts to load the real image,
 * falls back to a category-themed gradient placeholder.
 */
export function SpotImage({ src, alt, category, className = '' }: SpotImageProps) {
  const [failed, setFailed] = useState(false);

  const gradient = categoryGradients[category] || 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--secondary)))';
  const emoji = categoryEmojis[category] || '📍';

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: gradient }}
      >
        <span className="text-4xl opacity-60">{emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
