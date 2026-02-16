import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bookmark, Star, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import { useSavedFortunes } from '@/hooks/useSavedFortunes';
import { GlobalHeader } from '@/components/GlobalHeader';
import { toast } from 'sonner';

export default function SavedFortunes() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { canSaveFortunes } = useUserEntitlements();
  const { savedFortunes, loading, deleteFortune } = useSavedFortunes();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDelete = async (id: string) => {
    await deleteFortune(id);
    toast.success('Fortune removed');
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
            With Plus, you can save fortunes that resonate with you and revisit them anytime.
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
          <h1 className="font-display text-xl font-bold">Saved Fortunes</h1>
          <span className="text-sm text-muted-foreground">{savedFortunes.length} saved</span>
        </div>

        {savedFortunes.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No saved fortunes yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Spin and save the ones that speak to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedFortunes.map((fortune) => (
              <div key={fortune.id} className="bg-card rounded-xl p-4 border border-border/50 relative group">
                <p className="text-sm italic text-foreground/80 leading-relaxed pr-8">
                  "{fortune.fortune_text}"
                </p>
                {fortune.fortune_pack_id && (
                  <p className="text-[10px] text-primary font-medium mt-2 capitalize">
                    {fortune.fortune_pack_id.replace('_', ' ')} pack
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(fortune.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDelete(fortune.id)}
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
