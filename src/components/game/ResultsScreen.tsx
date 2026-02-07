import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { Navigation, Share2, Calendar, Music, Loader2, Flag, MapPin } from 'lucide-react';
import { FortuneWheel } from './FortuneWheel';
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
  const [showConfetti, setShowConfetti] = useState(false);
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
    setShowConfetti(true);
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

    setTimeout(() => setShowConfetti(false), 4000);
  };

  useEffect(() => {
    if (showResult && isEventCategory) {
      searchEvents(winner.name, winner.category, undefined, userCoordinates);
    }
  }, [timeframe]);

  const handleGetDirections = () => {
    const searchQuery = encodeURIComponent(winner.name);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    let mapsUrl: string;

    if (isMobile) {
      if (isIOS) {
        mapsUrl = `maps://maps.apple.com/?daddr=${searchQuery}&dirflg=d`;
      } else {
        mapsUrl = `google.navigation:q=${searchQuery}`;
      }
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
      const link = document.createElement('a');
      link.href = mapsUrl;
      link.click();
      setTimeout(() => { window.open(fallbackUrl, '_blank'); }, 1000);
    } else {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;
      window.open(mapsUrl, '_blank');
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
      {showConfetti && <Confetti />}

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

      {/* Result Phase */}
      {showResult && (
        <div className="w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold mb-1">The wheel has spoken</h1>
            <p className="text-muted-foreground">Here's your pick</p>
          </div>

          {/* Fortune */}
          <div className="gradient-warm rounded-2xl p-4 mb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="text-lg">{packInfo.emoji}</span>
              <span className="text-primary-foreground/80 text-xs font-medium">{packInfo.name} Fortune</span>
            </div>
            <p className="text-primary-foreground/90 italic text-sm leading-relaxed">"{fortune}"</p>
          </div>

          {/* Winner Card */}
          <div className="bg-card rounded-2xl shadow-card-hover overflow-hidden mb-5">
            <div className="relative h-44">
              <img src={winner.image} alt={winner.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
              <div className="absolute top-3 right-3">
                <span className="gradient-warm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-glow">
                  🥇 The Pick
                </span>
              </div>
              <div className="absolute top-3 left-3">
                <span className="bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-lg">
                  {categoryEmojis[winner.category] || '📍'}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-display text-xl font-bold">{winner.name}</h2>
                  <span className="text-primary text-sm font-medium capitalize">{winner.cuisine || winner.category}</span>
                </div>
                <div className="flex items-center gap-1 text-accent bg-accent/10 px-2.5 py-1 rounded-full text-sm">
                  ⭐ <span className="font-semibold">{winner.rating}</span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{winner.description}</p>

              <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className={i < winner.priceLevel ? 'opacity-100' : 'opacity-25'}>💵</span>
                  ))}
                </div>
                <span>📍 Nearby</span>
                {winner.isOutdoor && <span>🌳</span>}
                {winner.smokingFriendly && <span>🚬</span>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {winner.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-secondary px-2.5 py-1 rounded-full text-xs font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 mb-5">
            <Button variant="hero" size="xl" className="w-full group" onClick={handleGetDirections}>
              Open in Maps
              <Navigation className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleShareMyFate}
              disabled={isSharing}
            >
              {isSharing ? 'Creating...' : 'Share My Fate'}
              <Share2 className="w-4 h-4 ml-2" />
            </Button>

            <Button variant="outline" size="lg" className="w-full" onClick={onPlayAgain}>
              {isTrialMode ? 'Create Account to Continue' : 'Spin Again'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => window.open('mailto:support@youpick.app?subject=Problem Report - YouPick&body=Hi, I encountered an issue with the app:%0A%0ASpot: ' + encodeURIComponent(winner.name) + '%0ACategory: ' + encodeURIComponent(winner.category) + '%0A%0ADescribe the problem:%0A', '_blank')}
            >
              <Flag className="w-3.5 h-3.5 mr-1.5" />
              Report a Problem
            </Button>
          </div>

          {/* Events */}
          {isEventCategory && (
            <EventsSection
              events={events}
              isLoading={eventsLoading}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              userCoordinates={userCoordinates}
            />
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

function Confetti() {
  const emojis = ['🎉', '🎊', '✨', '⭐', '💫', '🌟'];
  const confettiPieces = Array.from({ length: 20 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((_, i) => {
        const left = Math.random() * 100;
        const top = 100 + Math.random() * 20;
        const duration = 2.5 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        return (
          <div
            key={i}
            className="absolute text-xl"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animation: `confetti ${duration}s ease-out forwards`,
              animationDelay: `${delay}s`,
            }}
          >
            {emojis[i % emojis.length]}
          </div>
        );
      })}
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
          {events.slice(0, 3).map((event, index) => (
            <div key={index} className="bg-secondary/40 rounded-xl p-3 flex items-start gap-3">
              <span className="text-xl">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs truncate">{event.name}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {event.date} {event.time && `· ${event.time}`}
                </p>
                {(event.venue || event.distance !== undefined) && (
                  <p className="text-[11px] text-primary truncate">
                    {event.distance !== undefined ? formatEventDistance(event) : '📍'} {event.venue}
                  </p>
                )}
              </div>
            </div>
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