import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { ExternalLink, Globe, RotateCcw, Calendar, Music, Loader2, MapPin, Navigation } from 'lucide-react';
import { FortuneWheel } from './FortuneWheel';
import { SpotImage } from './SpotImage';
import { useFortunes, FORTUNE_PACKS } from '@/hooks/useFortunes';
import { useEventSearch, Timeframe, LocalEvent } from '@/hooks/useEventSearch';
import html2canvas from 'html2canvas';
import { formatDistanceWithEmoji, type Coordinates } from '@/hooks/useGeolocation';

interface ResultsScreenProps {
  winner: Spot;
  likedSpots?: Spot[];
  fortunePack?: string;
  onPlayAgain: () => void;
  isTrialMode?: boolean;
  userCoordinates?: Coordinates | null;
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
};

export function ResultsScreen({ winner, likedSpots = [], fortunePack = 'free', onPlayAgain, isTrialMode, userCoordinates }: ResultsScreenProps) {
  const [showWheel, setShowWheel] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { getFortuneByPackId, getPackInfo } = useFortunes();
  const { events, isLoading: eventsLoading, timeframe, setTimeframe, searchEvents } = useEventSearch();
  const packInfo = getPackInfo(fortunePack);
  const isEventCategory = true;

  useEffect(() => {
    const spinTimer = setTimeout(() => setSpinning(true), 500);
    return () => clearTimeout(spinTimer);
  }, []);

  const handleSpinComplete = async () => {
    const result = await getFortuneByPackId(fortunePack);

    if (result.accessDenied) {
      const freeResult = await getFortuneByPackId('free');
      setFortune(freeResult.fortune || 'Great things are coming your way! ✨');
    } else {
      setFortune(result.fortune);
    }

    setTimeout(() => {
      setShowWheel(false);
      setShowResult(true);
      if (isEventCategory) {
        searchEvents(winner.name, winner.category, undefined, userCoordinates);
      }
    }, 1500);
  };

  useEffect(() => {
    if (showResult && isEventCategory) {
      searchEvents(winner.name, winner.category, undefined, userCoordinates);
    }
  }, [timeframe]);

  const handleViewDetails = () => {
    const searchQuery = encodeURIComponent(winner.name);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const handleOpenWebsite = () => {
    const searchQuery = encodeURIComponent(winner.name + ' website');
    window.open(`https://www.google.com/search?q=${searchQuery}&btnI=1`, '_blank');
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent(winner.name);
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      window.open(`maps://maps.apple.com/?q=${query}`, '_blank');
    } else if (/android/i.test(ua)) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleShareMyFate = async () => {
    if (!shareCardRef.current) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#1a1625',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });
      const file = new File([blob], 'my-fate-youpick.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'You Pick chose my fate! 🥢',
          text: `The wheel picked ${winner.name} for me! 🎯\n\n"${fortune}"`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-fate-youpick.png';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getWheelEmojis = () => {
    if (likedSpots.length === 0) {
      return ['🎯', '✨', '🎲', '🌟', '💫', '🎯'];
    }
    return likedSpots.map(spot => categoryEmojis[spot.category] || '📍');
  };
  const wheelItems = getWheelEmojis();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Wheel Phase */}
      {showWheel && (
        <div className="w-full max-w-md animate-slide-up text-center">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Spinning the wheel...</h1>
            <p className="text-muted-foreground text-sm">Let fate decide</p>
          </div>
          <FortuneWheel items={wheelItems} onSpinComplete={handleSpinComplete} spinning={spinning} />
        </div>
      )}

      {/* Result Phase — frosted glass card */}
      {showResult && (
        <div className="w-full max-w-md animate-scale-in">
          <div
            className="relative rounded-3xl border border-border/30 overflow-hidden shadow-glow"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.85), hsl(var(--card) / 0.65))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Subtle gradient glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)',
              }}
            />

            {/* Business Image */}
            <div className="relative h-48 overflow-hidden">
              <SpotImage src={winner.image} alt={winner.name} category={winner.category} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {winner.cuisine || winner.category}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="relative p-6 pt-4 text-center">
              <p className="text-xs font-medium text-primary tracking-widest uppercase mb-2">Your Pick</p>
              <h2 className="font-display text-2xl font-bold mb-1 leading-tight">{winner.name}</h2>
              <p className="text-sm text-muted-foreground mb-1">{winner.description}</p>

              {/* Neighborhood & Distance */}
              {(winner.neighborhood || (winner as any).distance !== undefined) && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mb-1">
                  📍 {winner.neighborhood || 'Nearby'}
                  {(winner as any).distance !== undefined && (
                    <span className="bg-secondary px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                      {(winner as any).distance < 1 ? '🚶' : (winner as any).distance < 5 ? '🚗' : '🗺️'} {(winner as any).distance < 0.1 ? '<0.1' : (winner as any).distance} mi
                    </span>
                  )}
                </p>
              )}

              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-5 mt-3">
                <span className="flex items-center gap-1">
                  ⭐ <span className="font-semibold text-foreground">{winner.rating}</span>
                </span>
                <span className="w-px h-3 bg-border" />
                <span>{Array.from({ length: winner.priceLevel }).map(() => '$').join('')}</span>
              </div>

              {fortune && (
                <div className="bg-secondary/60 rounded-xl p-3 mb-5">
                  <p className="text-sm italic text-muted-foreground leading-relaxed">"{fortune}"</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <Button variant="hero" size="lg" className="w-full" onClick={handleViewDetails}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button variant="default" size="lg" className="w-full" onClick={handleOpenMaps}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={onPlayAgain}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isTrialMode ? 'Create Account to Continue' : 'Spin Again'}
                </Button>
              </div>
            </div>
          </div>

          {/* Events — below the card */}
          {isEventCategory && (
            <div className="mt-5">
              <EventsSection
                events={events}
                isLoading={eventsLoading}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                userCoordinates={userCoordinates}
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden Shareable Card */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <div
          ref={shareCardRef}
          className="w-[400px] p-6 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a1625 100%)' }}
        >
          <div className="text-center mb-4">
            <span className="text-4xl">🥢</span>
            <h2 className="text-2xl font-extrabold text-white mt-2">You Pick</h2>
            <p className="text-purple-300 text-sm">The wheel has spoken</p>
          </div>
          <div className="w-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-4 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">{packInfo.emoji}</span>
              <span className="text-white font-bold text-sm">{packInfo.name} Fortune</span>
            </div>
            <p className="text-white/90 italic text-sm">"{fortune}"</p>
          </div>
          <div className="w-full bg-white/10 backdrop-blur rounded-xl overflow-hidden">
            <img src={winner.image} alt={winner.name} className="w-full h-32 object-cover" crossOrigin="anonymous" />
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{categoryEmojis[winner.category] || '📍'}</span>
                <h3 className="text-xl font-bold text-white">{winner.name}</h3>
              </div>
              <p className="text-purple-200 text-sm mb-2">{winner.cuisine || winner.category}</p>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                ⭐ <span className="font-bold">{winner.rating}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-purple-300/60 text-xs">I had no choice 🤷‍♀️</p>
            <p className="text-purple-400 text-xs font-semibold mt-1">youpick.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EventsSectionProps {
  events: LocalEvent[];
  isLoading: boolean;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  userCoordinates?: Coordinates | null;
}

function EventsSection({ events, isLoading, timeframe, onTimeframeChange, userCoordinates }: EventsSectionProps) {
  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'music': return '🎵';
      case 'sports': return '🏆';
      case 'festival': return '🎉';
      case 'comedy': return '🎭';
      case 'food': return '🍽️';
      case 'art': return '🎨';
      default: return '✨';
    }
  };

  const formatEventDistance = (event: LocalEvent): string | null => {
    if (event.distance !== undefined) {
      return formatDistanceWithEmoji(event.distance);
    }
    return null;
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Live Events</h3>
        </div>
        {userCoordinates && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> By distance
          </span>
        )}
      </div>

      <div className="flex gap-1.5 mb-3">
        {timeframeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeframeChange(option.value)}
            className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeframe === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground text-sm">Finding events...</span>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-2">
          {events.slice(0, 5).map((event, index) => (
            <a
              key={index}
              href={event.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(event.name + ' ' + (event.venue || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/40 rounded-xl p-3 flex items-start gap-3 hover:bg-secondary/60 transition-colors cursor-pointer block"
            >
              <span className="text-xl shrink-0">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs truncate">{event.name}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {event.date} {event.time && `· ${event.time}`}
                </p>
                {event.venue && (
                  <p className="text-[11px] text-primary truncate">
                    {event.distance !== undefined ? formatEventDistance(event) : '📍'} {event.venue}
                  </p>
                )}
                {event.address && !event.venue && (
                  <p className="text-[11px] text-muted-foreground truncate">📍 {event.address}</p>
                )}
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted-foreground">
          <Music className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-xs">No events found</p>
          <p className="text-[10px] mt-0.5">Try a different timeframe</p>
        </div>
      )}
    </div>
  );
}
