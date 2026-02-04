import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { Navigation, Share2, Calendar, Music, Trophy, Loader2, Flag } from 'lucide-react';
import { FortuneWheel } from './FortuneWheel';
import { useFortunes, FORTUNE_PACKS } from '@/hooks/useFortunes';
import { useEventSearch, Timeframe, LocalEvent } from '@/hooks/useEventSearch';
import html2canvas from 'html2canvas';

interface ResultsScreenProps {
  winner: Spot;
  fortunePack?: string;
  onPlayAgain: () => void;
  isTrialMode?: boolean;
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
};

export function ResultsScreen({ winner, fortunePack = 'free', onPlayAgain, isTrialMode }: ResultsScreenProps) {
  const [showWheel, setShowWheel] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const { getFortuneByPackId, getPackInfo } = useFortunes();
  const { events, isLoading: eventsLoading, timeframe, setTimeframe, searchEvents } = useEventSearch();

  // Get the pack info for display
  const packInfo = getPackInfo(fortunePack);

  // All categories can show events now
  const isEventCategory = true;

  useEffect(() => {
    // Start spinning after a brief delay
    const spinTimer = setTimeout(() => {
      setSpinning(true);
    }, 500);

    return () => clearTimeout(spinTimer);
  }, []);

  const handleSpinComplete = async () => {
    setShowConfetti(true);
    
    // Fetch fortune from database - RLS enforces access control server-side
    const result = await getFortuneByPackId(fortunePack);
    
    if (result.accessDenied) {
      // User doesn't have entitlements for this pack - fallback to free
      const freeResult = await getFortuneByPackId('free');
      setFortune(freeResult.fortune || 'Great things are coming your way! ✨');
    } else {
      setFortune(result.fortune);
    }
    
    setTimeout(() => {
      setShowWheel(false);
      setShowResult(true);
      
      // Search for events if this is an event-worthy category
      if (isEventCategory) {
        searchEvents(winner.name, winner.category);
      }
    }, 1500);

    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Re-search when timeframe changes
  useEffect(() => {
    if (showResult && isEventCategory) {
      searchEvents(winner.name, winner.category);
    }
  }, [timeframe]);

  const handleGetDirections = () => {
    // Create a search query for the spot
    const searchQuery = encodeURIComponent(`${winner.name} ${winner.cuisine || winner.category} near me`);
    
    // Check if on mobile to use appropriate maps URL
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    let mapsUrl: string;
    
    if (isMobile) {
      if (isIOS) {
        // Apple Maps URL scheme - opens Apple Maps on iOS
        mapsUrl = `maps://maps.apple.com/?q=${searchQuery}`;
      } else {
        // Google Maps intent for Android
        mapsUrl = `geo:0,0?q=${searchQuery}`;
      }
      
      // Try to open native app, fallback to Google Maps web
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      
      // Create a hidden link and try to open native maps
      const link = document.createElement('a');
      link.href = mapsUrl;
      link.click();
      
      // Fallback after a short delay if native app doesn't open
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else {
      // Desktop - open Google Maps in new tab
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleShareMyFate = async () => {
    if (!shareCardRef.current) return;
    
    setIsSharing(true);
    
    try {
      // Render the share card to canvas
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
      
      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'YouPick chose my fate! 🥢',
          text: `The toothpick picked ${winner.name} for me! 🎯\n\n"${fortune}"`,
          files: [file],
        });
      } else {
        // Fallback: download the image
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

  // Create wheel items from winner name (we just show the winner spinning to build suspense)
  const wheelItems = [winner.name, '???', winner.name, '???', winner.name, '???'];

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Floating celebration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-20 left-10 text-5xl animate-float">🎉</span>
        <span className="absolute top-32 right-16 text-4xl animate-float" style={{ animationDelay: '0.3s' }}>🎊</span>
        <span className="absolute bottom-40 left-20 text-5xl animate-float" style={{ animationDelay: '0.6s' }}>🥳</span>
        <span className="absolute bottom-32 right-12 text-4xl animate-float" style={{ animationDelay: '0.9s' }}>✨</span>
      </div>

      {/* Wheel Phase */}
      {showWheel && (
        <div className="w-full max-w-md animate-bounce-in relative z-10 text-center">
          <div className="mb-6">
            <span className="text-5xl mb-4 block">🥢</span>
            <h1 className="text-3xl font-extrabold mb-2">Let the Chopstick Pick...</h1>
            <p className="text-muted-foreground">Spinning the wheel of fortune!</p>
          </div>

          <FortuneWheel
            items={wheelItems}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
          />

          {!spinning && (
            <p className="mt-6 text-muted-foreground animate-pulse">
              Get ready... 🎡
            </p>
          )}
        </div>
      )}

      {/* Result Phase */}
      {showResult && (
        <div className="w-full max-w-md animate-bounce-in relative z-10">
          {/* Winner Header */}
          <div className="text-center mb-6">
            <div className="inline-block mb-4 relative">
              <span className="text-7xl">🏆</span>
              <span className="absolute -top-2 -right-2 text-3xl animate-bounce">✨</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2">The Chopstick Has Spoken!</h1>
            <p className="text-muted-foreground text-lg">Time to head out! 🚗💨</p>
          </div>

          {/* Fortune Cookie */}
          <div className="gradient-warm rounded-2xl p-4 mb-6 shadow-glow text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{packInfo.emoji}</span>
              <span className="text-primary-foreground font-bold">{packInfo.name} Fortune</span>
              <span className="text-2xl">{packInfo.emoji}</span>
            </div>
            <p className="text-primary-foreground/90 italic text-lg">"{fortune}"</p>
          </div>

          {/* Winner Card */}
          <div className="gradient-card rounded-3xl shadow-card-hover overflow-hidden mb-6">
            {/* Image */}
            <div className="relative h-48">
              <img
                src={winner.image}
                alt={winner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              
              {/* Winner Badge */}
              <div className="absolute top-4 right-4">
                <span className="gradient-warm text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-glow">
                  <span className="text-lg">🥇</span> The Pick!
                </span>
              </div>

              {/* Category */}
              <div className="absolute top-4 left-4">
                <span className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-2xl">
                  {categoryEmojis[winner.category] || '📍'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{winner.name}</h2>
                  <span className="text-primary font-semibold capitalize">
                    {winner.cuisine || winner.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-warning bg-warning/10 px-3 py-1 rounded-full">
                  <span>⭐</span>
                  <span className="font-bold">{winner.rating}</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-3">{winner.description}</p>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < winner.priceLevel ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      💵
                    </span>
                  ))}
                </div>
                <span>📍 Nearby</span>
                {winner.isOutdoor && <span>🌳</span>}
                {winner.smokingFriendly && <span>🚬</span>}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {winner.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <Button 
              variant="hero" 
              size="xl" 
              className="w-full group"
              onClick={handleGetDirections}
            >
              <span className="text-2xl mr-2">🗺️</span>
              Open in Maps
              <Navigation className="w-5 h-5 ml-2" />
            </Button>
            
            {/* Share My Fate Button */}
            <Button 
              variant="default" 
              size="lg" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              onClick={handleShareMyFate}
              disabled={isSharing}
            >
              <span className="text-xl mr-2">✨</span>
              {isSharing ? 'Creating...' : 'Share My Fate'}
              <Share2 className="w-5 h-5 ml-2" />
            </Button>
            
            <Button variant="outline" size="lg" className="w-full" onClick={onPlayAgain}>
              <span className="text-xl mr-2">{isTrialMode ? '✨' : '🔄'}</span>
              {isTrialMode ? 'Create Account to Keep Playing' : 'Pick Again'}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => window.open('mailto:support@youpick.app?subject=Problem Report - YouPick&body=Hi, I encountered an issue with the app:%0A%0ASpot: ' + encodeURIComponent(winner.name) + '%0ACategory: ' + encodeURIComponent(winner.category) + '%0A%0ADescribe the problem:%0A', '_blank')}
            >
              <Flag className="w-4 h-4 mr-2" />
              Report a Problem
            </Button>
          </div>

          {/* Live Events Section */}
          {isEventCategory && (
            <EventsSection 
              events={events} 
              isLoading={eventsLoading} 
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}
        </div>
      )}

      {/* Hidden Shareable Card - rendered offscreen for capture */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <div
          ref={shareCardRef}
          className="w-[400px] p-6 flex flex-col items-center"
          style={{
            background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a1625 100%)',
          }}
        >
          {/* YouPick Branding */}
          <div className="text-center mb-4">
            <span className="text-4xl">🥢</span>
            <h2 className="text-2xl font-extrabold text-white mt-2">YouPick</h2>
            <p className="text-purple-300 text-sm">The universe has spoken!</p>
          </div>

          {/* Fortune */}
          <div className="w-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-4 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">{packInfo.emoji}</span>
              <span className="text-white font-bold text-sm">{packInfo.name} Fortune</span>
              <span className="text-xl">{packInfo.emoji}</span>
            </div>
            <p className="text-white/90 italic text-sm">"{fortune}"</p>
          </div>

          {/* Winner Spot */}
          <div className="w-full bg-white/10 backdrop-blur rounded-xl overflow-hidden">
            <img
              src={winner.image}
              alt={winner.name}
              className="w-full h-32 object-cover"
              crossOrigin="anonymous"
            />
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{categoryEmojis[winner.category] || '📍'}</span>
                <h3 className="text-xl font-bold text-white">{winner.name}</h3>
              </div>
              <p className="text-purple-200 text-sm mb-2">{winner.cuisine || winner.category}</p>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                <span>⭐</span>
                <span className="font-bold">{winner.rating}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
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
  const emojis = ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '🥢', '🥠'];
  const confettiPieces = Array.from({ length: 30 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((_, i) => {
        const left = Math.random() * 100;
        const top = 100 + Math.random() * 20;
        const duration = 2 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        
        return (
          <div
            key={i}
            className="absolute text-2xl"
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

// Events Section Component
interface EventsSectionProps {
  events: LocalEvent[];
  isLoading: boolean;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

function EventsSection({ events, isLoading, timeframe, onTimeframeChange }: EventsSectionProps) {
  const timeframeOptions: { value: Timeframe; label: string; emoji: string }[] = [
    { value: 'today', label: 'Today', emoji: '📅' },
    { value: 'week', label: 'This Week', emoji: '🗓️' },
    { value: 'month', label: 'This Month', emoji: '📆' },
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

  return (
    <div className="gradient-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Live Events</h3>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {timeframeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeframeChange(option.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              timeframe === option.value
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span className="mr-1">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Finding events...</span>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className="bg-background/50 rounded-xl p-3 flex items-start gap-3"
            >
              <span className="text-2xl">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{event.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {event.date} {event.time && `• ${event.time}`}
                </p>
                {event.venue && (
                  <p className="text-xs text-primary truncate">📍 {event.venue}</p>
                )}
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No events found for this timeframe</p>
          <p className="text-xs mt-1">Try a different date range!</p>
        </div>
      )}
    </div>
  );
}
