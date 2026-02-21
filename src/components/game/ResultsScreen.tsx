import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/game';
import { ExternalLink, Globe, RotateCcw, Calendar, Music, Loader2, MapPin, Navigation, ThumbsDown, Lock, Star, Share2, Bookmark, ChevronLeft, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { FortuneWheel } from './FortuneWheel';
import { SpotImage } from './SpotImage';
import { ReviewModal } from './ReviewModal';
import { PostSpinCardDraw } from './PostSpinCardDraw';
import { useEventSearch, Timeframe, LocalEvent } from '@/hooks/useEventSearch';
import { useSavedSpins } from '@/hooks/useSavedSpins';
import { usePlaceReviews } from '@/hooks/usePlaceReviews';
import html2canvas from 'html2canvas';
import { formatDistanceWithEmoji, type Coordinates } from '@/hooks/useGeolocation';
import { toast } from 'sonner';


interface ResultsScreenProps {
  winner: Spot;
  likedSpots?: Spot[];
  fortunePack?: string;
  
  onPlayAgain: () => void;
  onNotForMe?: (spotId: string) => void;
  isTrialMode?: boolean;
  userCoordinates?: Coordinates | null;
  isPremium?: boolean;
  ownedPacks?: string[];
  onFortunePackChange?: (packId: string) => void;
  canSaveFortunes?: boolean;
  onSaveFortune?: (fortuneText: string, packId: string) => void;
  onPostToFeed?: (shouldPost: boolean, caption: string) => void;
  isAuthenticated?: boolean;
  onAwardPoints?: (reason: string, points: number) => void;
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  activity: '🎮',
  bar: '🍸',
  cafe: '☕',
  nightlife: '🌙',
  wellness: '🧘',
};

/** Mini photo carousel for result cards with multiple Google photos */
function PhotoCarousel({ photos, alt, category }: { photos: string[]; alt: string; category: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const validPhotos = photos.filter((_, i) => !failed.has(i));
  if (validPhotos.length === 0) {
    return <SpotImage src="" alt={alt} category={category} className="w-full h-full" />;
  }

  const safeIdx = Math.min(currentIdx, validPhotos.length - 1);

  return (
    <div className="relative w-full h-full group">
      <img
        src={validPhotos[safeIdx]}
        alt={`${alt} photo ${safeIdx + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
        draggable={false}
        onError={() => {
          const origIdx = photos.indexOf(validPhotos[safeIdx]);
          setFailed(prev => new Set(prev).add(origIdx));
        }}
      />
      {validPhotos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIdx((safeIdx - 1 + validPhotos.length) % validPhotos.length); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIdx((safeIdx + 1) % validPhotos.length); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-background/60 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {validPhotos.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === safeIdx ? 'bg-primary' : 'bg-background/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ResultsScreen({ 
  winner, likedSpots = [], fortunePack = 'fools_journey', onPlayAgain, onNotForMe,
  isTrialMode, userCoordinates, isPremium = false, ownedPacks = [], onFortunePackChange,
  canSaveFortunes = false, onSaveFortune, onPostToFeed, isAuthenticated = false, onAwardPoints
}: ResultsScreenProps) {
  const [showWheel, setShowWheel] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [fortuneSaved, setFortuneSaved] = useState(false);
  const [postToFeed, setPostToFeed] = useState(true);
  const [feedCaption, setFeedCaption] = useState('');
  const [feedPosted, setFeedPosted] = useState(false);
  const [spinSaved, setSpinSaved] = useState(false);
  const [spinNote, setSpinNote] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { events, isLoading: eventsLoading, timeframe, setTimeframe, searchEvents } = useEventSearch();
  const { saveSpin } = useSavedSpins();
  const { addReview } = usePlaceReviews();
  const isEventCategory = true;

  useEffect(() => {
    const spinTimer = setTimeout(() => setSpinning(true), 500);
    return () => clearTimeout(spinTimer);
  }, []);

  const handleSpinComplete = async () => {
    setTimeout(() => {
      setShowWheel(false);
      setShowResult(true);
      if (isEventCategory) {
        searchEvents(winner.name, winner.category, undefined, userCoordinates);
      }
    }, 1500);
  };

  // Fire feed post on unmount or when user takes an action
  useEffect(() => {
    return () => {
      if (!feedPosted && onPostToFeed) {
        onPostToFeed(postToFeed, feedCaption);
      }
    };
  }, []);

  // Also fire when user clicks any action button
  const firePost = () => {
    if (!feedPosted && onPostToFeed) {
      setFeedPosted(true);
      onPostToFeed(postToFeed, feedCaption);
    }
  };

  useEffect(() => {
    if (showResult && isEventCategory) {
      searchEvents(winner.name, winner.category, undefined, userCoordinates);
    }
  }, [timeframe]);

  const handleOpenMaps = () => {
    const hasCoords = winner.latitude && winner.longitude;
    const query = encodeURIComponent(winner.name);
    const ua = navigator.userAgent || '';
    
    if (hasCoords) {
      // Use coordinates for precise navigation
      const lat = winner.latitude;
      const lng = winner.longitude;
      if (/iPad|iPhone|iPod/.test(ua)) {
        window.open(`maps://maps.apple.com/?q=${query}&ll=${lat},${lng}`, '_blank');
      } else if (/android/i.test(ua)) {
        window.open(`geo:${lat},${lng}?q=${lat},${lng}(${query})`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      }
    } else {
      // Fallback to name-based query
      if (/iPad|iPhone|iPod/.test(ua)) {
        window.open(`maps://maps.apple.com/?q=${query}`, '_blank');
      } else if (/android/i.test(ua)) {
        window.open(`geo:0,0?q=${query}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
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
      onAwardPoints?.('share', 5);
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

            {/* Business Image — mini carousel if multiple photos */}
            <div className="relative h-48 overflow-hidden">
              {winner.photoUrls && winner.photoUrls.length > 1 ? (
                <PhotoCarousel photos={winner.photoUrls} alt={winner.name} category={winner.category} />
              ) : (
                <SpotImage src={winner.image} alt={winner.name} category={winner.category} className="w-full h-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent pointer-events-none" />
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

              {/* Pick a Card — deal from deck_cards */}
              <div className="mb-5">
                <PostSpinCardDraw
                  deckId={fortunePack}
                  isPremium={isPremium}
                  ownedPacks={ownedPacks}
                  canSaveFortunes={canSaveFortunes}
                  onSaveFortune={onSaveFortune}
                  onCardRevealed={(card) => {
                    setFortune(card.action_text);
                  }}
                  onUpgrade={() => {
                    window.location.href = '/membership';
                  }}
                />
              </div>

              {/* Post to Feed toggle */}
              {isAuthenticated && onPostToFeed && !feedPosted && (
                <div className="bg-secondary/40 rounded-xl p-3 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      📣 Post to Feed
                    </label>
                    <button
                      onClick={() => setPostToFeed(!postToFeed)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        postToFeed ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-primary-foreground rounded-full absolute top-1 transition-transform ${
                        postToFeed ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {postToFeed && (
                    <input
                      type="text"
                      placeholder="Add a caption (optional)"
                      value={feedCaption}
                      onChange={(e) => setFeedCaption(e.target.value)}
                      maxLength={140}
                      className="w-full bg-background/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              )}

              {/* Save Spin Moment */}
              {isAuthenticated && !spinSaved && (
                <div className="bg-secondary/40 rounded-xl p-3 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-primary" /> Save This Moment
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Add a private note (optional)"
                    value={spinNote}
                    onChange={(e) => setSpinNote(e.target.value)}
                    maxLength={200}
                    className="w-full bg-background/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      const saved = await saveSpin({
                        place_name: winner.name,
                        place_id: winner.id || null,
                        category: winner.category || null,
                        fortune_text: fortune || null,
                        fortune_pack: fortunePack || null,
                        photo_url: winner.image || null,
                        address: winner.neighborhood || null,
                        latitude: winner.latitude || null,
                        longitude: winner.longitude || null,
                        note: spinNote || null,
                      });
                      if (saved) {
                        setSpinSaved(true);
                        onAwardPoints?.('save', 3);
                      }
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-1.5" /> Save Spin
                  </Button>
                </div>
              )}
              {spinSaved && (
                <div className="bg-primary/5 rounded-xl p-3 mb-5 text-center">
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-current" /> Moment saved to your profile
                  </p>
                </div>
              )}

              {/* Leave a Review */}
              {isAuthenticated && !reviewSubmitted && (
                <div className="mb-5">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full bg-secondary/40 rounded-xl p-3 text-sm font-medium text-foreground flex items-center justify-center gap-1.5 hover:bg-secondary/60 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary" /> Leave a Review
                  </button>
                </div>
              )}
              {reviewSubmitted && (
                <div className="bg-primary/5 rounded-xl p-3 mb-5 text-center">
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-current" /> Review submitted!
                  </p>
                </div>
              )}

              <ReviewModal
                open={showReviewForm}
                onOpenChange={setShowReviewForm}
                placeName={winner.name}
                onSubmit={async (data) => {
                  const submitted = await addReview({
                    place_name: winner.name,
                    place_id: winner.id || null,
                    ...data,
                  });
                  if (submitted) setReviewSubmitted(true);
                  return !!submitted;
                }}
              />


              <div className="flex flex-col gap-2.5">
                <Button variant="hero" size="lg" className="w-full" onClick={() => { firePost(); handleOpenMaps(); }}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Pick This — Open in Maps
                </Button>
                <Button variant="default" size="lg" className="w-full" asChild>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(winner.name)}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </a>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => { firePost(); handleShareMyFate(); }} disabled={isSharing}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {isSharing ? 'Sharing...' : 'Share My Fate'}
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => { firePost(); onPlayAgain(); }}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isTrialMode ? 'Create Account' : 'Spin Again'}
                  </Button>
                </div>
                {onNotForMe && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full text-destructive hover:text-destructive" 
                    onClick={() => onNotForMe(winner.id)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Not For Me
                  </Button>
                )}
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
              <span className="text-xl">🃏</span>
              <span className="text-white font-bold text-sm">Your Card</span>
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
