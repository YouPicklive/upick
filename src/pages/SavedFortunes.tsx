import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bookmark, Star, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useSavedFortunes } from '@/hooks/useSavedFortunes';
import { GlobalHeader } from '@/components/GlobalHeader';
import { toast } from 'sonner';

const DECK_LABELS: Record<string, string> = {
  fools_journey: "Fool's Journey",
  night_out: 'Night Out',
  love_dating: 'Love & Dating',
  what_should_i_do: 'What Should I Do?',
};

export default function SavedFortunes() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { canSaveFortunes } = useUserEntitlements();
  const { savedCards, loading, deleteCard } = useSavedFortunes();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDelete = async (id: string) => {
    await deleteCard(id);
    toast.success('Card removed');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!canSaveFortunes) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Save Your Favorites</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            With Plus, you can save card draws that resonate with you and revisit them anytime.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate('/membership')}>
            <Star className="w-4 h-4 mr-2" /> Upgrade to Plus
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-bold">Saved Cards</h1>
          <span className="text-sm text-muted-foreground">{savedCards.length} saved</span>
        </div>

        {savedCards.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No saved cards yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Spin and save the ones that speak to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedCards.map((card) => (
              <div key={card.id} className="bg-card rounded-xl p-4 border border-border/50 relative group">
                <div className="flex items-start gap-3 pr-8">
                  <span className="text-xl mt-0.5">🃏</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground leading-tight">
                      {card.card_name}
                    </p>
                    <p className="text-sm italic text-muted-foreground leading-relaxed mt-0.5">
                      "{card.action_text}"
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] text-primary font-medium">
                        {DECK_LABELS[card.deck_id] || card.deck_id}
                      </span>
                      {card.vibe_tag && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          {card.vibe_tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(card.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
