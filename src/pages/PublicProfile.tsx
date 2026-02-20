import { useParams } from 'react-router-dom';
import { usePublicProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useSavedActivities, SavedActivity } from '@/hooks/useSavedActivities';
import { useSavedSpins, SavedSpin } from '@/hooks/useSavedSpins';
import { usePlaceReviews, PlaceReview } from '@/hooks/usePlaceReviews';
import { ReviewModal } from '@/components/game/ReviewModal';
import { MileMarkersTab } from '@/components/profile/MileMarkersTab';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Button } from '@/components/ui/button';
import { User, Settings, Loader2, Sparkles, MapPin, Bookmark, Calendar, ExternalLink, Clock, Heart, Star, MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';


function SavedActivityCard({ activity }: { activity: SavedActivity }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {activity.activity_type === 'event' ? (
            <Calendar className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{activity.title}</p>
          {activity.venue && (
            <p className="text-xs text-muted-foreground mt-0.5">📍 {activity.venue}</p>
          )}
          {activity.place_name && activity.place_name !== activity.venue && (
            <p className="text-xs text-muted-foreground mt-0.5">📍 {activity.place_name}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {activity.category && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                {activity.category}
              </span>
            )}
            {activity.event_date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" /> {activity.event_date}
              </span>
            )}
            {activity.event_time && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {activity.event_time}
              </span>
            )}
          </div>
        </div>
        {activity.source_url && (
          <a href={activity.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-primary transition-colors" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { profile, loading } = usePublicProfile(username);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [stats, setStats] = useState({ postCount: 0, likesReceived: 0 });
  const [activeTab, setActiveTab] = useState<'activity' | 'saved' | 'markers'>('activity');
  const [savedSubTab, setSavedSubTab] = useState<'spins' | 'events' | 'reviews'>('spins');

  const isOwner = isAuthenticated && user && profile && user.id === profile.id;

  // Fetch saved activities for the profile user
  const { savedActivities, loading: savedLoading } = useSavedActivities(profile?.id);
  const { savedSpins, loading: spinsLoading, deleteSpin, updateNote } = useSavedSpins(profile?.id);
  const { reviews, loading: reviewsLoading, deleteReview, updateReview } = usePlaceReviews(profile?.id);

  // Inline edit state for spin notes
  const [editingSpinId, setEditingSpinId] = useState<string | null>(null);
  const [editSpinNote, setEditSpinNote] = useState('');

  // Edit review modal state
  const [editingReview, setEditingReview] = useState<PlaceReview | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      const { data: feedPosts } = await supabase
        .from('feed_posts' as any)
        .select('*')
        .eq('user_id', profile.id)
        .eq('visibility', 'public')
        .eq('is_anonymous', false)
        .order('created_at', { ascending: false })
        .limit(30);

      setPosts((feedPosts as any[]) || []);

      const postCount = (feedPosts as any[])?.length || 0;

      const postIds = ((feedPosts as any[]) || []).map((p: any) => p.id);
      let likesReceived = 0;
      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes' as any)
          .select('id')
          .in('post_id', postIds);
        likesReceived = (likes as any[])?.length || 0;
      }

      setStats({ postCount, likesReceived });
      setPostsLoading(false);
    };

    fetchPosts();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="text-center py-20">
          <User className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold mb-1">User not found</h2>
          <p className="text-sm text-muted-foreground">@{username} doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-border/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="font-display text-xl font-bold">{profile.display_name || profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-foreground/80 mt-2 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>
          )}
          {(profile.city || profile.region) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {[profile.city, profile.region].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-display text-lg font-bold">{stats.postCount}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold">{stats.likesReceived}</p>
              <p className="text-[11px] text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold">{savedSpins.length + savedActivities.length}</p>
              <p className="text-[11px] text-muted-foreground">Saved</p>
            </div>
          </div>

          {isOwner && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/settings')}>
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border/50">
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Saved
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('markers')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'markers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🏁 Mile Markers
            </button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'markers' && isOwner && profile && (
          <MileMarkersTab userId={profile.id} />
        )}
        {activeTab === 'activity' && (
          <div>
            {postsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <Sparkles className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post: any) => (
                  <div key={post.id} className="bg-card rounded-xl border border-border/50 p-4">
                    <p className="text-sm font-semibold text-foreground">{post.title}</p>
                    {post.result_name && post.result_name !== post.title && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {post.result_name}</p>
                    )}
                    {post.body && (
                      <p className="text-sm text-foreground/70 mt-1">{post.body}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex gap-1 mb-4">
              {([
                { key: 'spins' as const, label: 'Spins', icon: Heart, count: savedSpins.length },
                { key: 'events' as const, label: 'Events', icon: Calendar, count: savedActivities.length },
                { key: 'reviews' as const, label: 'Reviews', icon: Star, count: reviews.length },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSavedSubTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    savedSubTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <tab.icon className="w-3 h-3" /> {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Spins sub-tab */}
            {savedSubTab === 'spins' && (
              spinsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : savedSpins.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? 'Save spin moments from your results to see them here ✨' : 'No saved spins yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSpins.map(spin => (
                    <div key={spin.id} className="bg-card rounded-xl border border-border/50 p-4">
                      <div className="flex items-start gap-3">
                        {spin.photo_url && (
                          <img src={spin.photo_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{spin.place_name}</p>
                          {spin.category && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                              {spin.category}
                            </span>
                          )}
                          {spin.fortune_text && (
                            <p className="text-xs italic text-muted-foreground mt-1.5 line-clamp-2">"{spin.fortune_text}"</p>
                          )}
                          {isOwner && editingSpinId === spin.id ? (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editSpinNote}
                                onChange={(e) => setEditSpinNote(e.target.value)}
                                maxLength={200}
                                placeholder="Add a note…"
                                className="flex-1 bg-background border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                              />
                              <button
                                onClick={async () => {
                                  await updateNote(spin.id, editSpinNote);
                                  setEditingSpinId(null);
                                }}
                                className="p-1 text-primary hover:text-primary/80"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingSpinId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            spin.note && isOwner && (
                              <p
                                className="text-xs text-foreground/60 mt-1 flex items-center gap-1 cursor-pointer hover:text-foreground/80 transition-colors"
                                onClick={() => { setEditingSpinId(spin.id); setEditSpinNote(spin.note || ''); }}
                              >
                                <MessageSquare className="w-2.5 h-2.5" /> {spin.note} <Pencil className="w-2 h-2 ml-0.5 opacity-40" />
                              </p>
                            )
                          )}
                          {isOwner && !spin.note && editingSpinId !== spin.id && (
                            <button
                              onClick={() => { setEditingSpinId(spin.id); setEditSpinNote(''); }}
                              className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-0.5 hover:text-primary transition-colors"
                            >
                              <Pencil className="w-2.5 h-2.5" /> Add note
                            </button>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {formatDistanceToNow(new Date(spin.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {isOwner && (
                          <button onClick={() => deleteSpin(spin.id)} className="shrink-0 p-1 text-muted-foreground/40 hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Events sub-tab */}
            {savedSubTab === 'events' && (
              savedLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : savedActivities.length === 0 ? (
                <div className="text-center py-10">
                  <Bookmark className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? 'Save events and activities from the feed ✨' : 'No saved events yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedActivities.map(activity => (
                    <SavedActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              )
            )}

            {/* Reviews sub-tab */}
            {savedSubTab === 'reviews' && (
              reviewsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? 'Leave reviews from your spin results ✨' : 'No reviews yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-card rounded-xl border border-border/50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{review.place_name}</p>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                          {review.content && (
                            <p className="text-xs text-foreground/70 mt-1.5">{review.content}</p>
                          )}
                          {review.note && isOwner && (
                            <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1 italic">
                              <MessageSquare className="w-2.5 h-2.5" /> {review.note}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {isOwner && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => setEditingReview(review)}
                              className="p-1 text-muted-foreground/40 hover:text-primary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteReview(review.id)} className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Edit Review Modal */}
        {editingReview && (
          <ReviewModal
            open={!!editingReview}
            onOpenChange={(open) => { if (!open) setEditingReview(null); }}
            placeName={editingReview.place_name}
            initialRating={editingReview.rating}
            initialContent={editingReview.content || ''}
            initialNote={editingReview.note || ''}
            onSubmit={async (data) => {
              const success = await updateReview(editingReview.id, data);
              if (success) setEditingReview(null);
              return !!success;
            }}
          />
        )}
      </main>
    </div>
  );
}
