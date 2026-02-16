import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GlobalHeader } from '@/components/GlobalHeader';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SocialShare {
  id: string;
  created_at: string;
  user_id: string;
  platform: string;
  post_url: string;
  place_name: string | null;
  caption: string | null;
  status: string;
  username?: string;
  display_name?: string;
}

export default function AdminModeration() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [shares, setShares] = useState<SocialShare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setChecking(false);
      });
  }, [user, authLoading]);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_shares' as any)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!data) { setShares([]); setLoading(false); return; }

    const userIds = [...new Set((data as any[]).map((s: any) => s.user_id).filter(Boolean))];
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);
      profileMap = new Map((profiles || []).map(p => [p.id, p]));
    }

    setShares((data as any[]).map((s: any) => {
      const prof = profileMap.get(s.user_id);
      return { ...s, username: prof?.username, display_name: prof?.display_name };
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchShares();
  }, [isAdmin, fetchShares]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const update: any = { status: action };
    if (action === 'approved') update.approved_at = new Date().toISOString();

    const { error } = await supabase
      .from('social_shares' as any)
      .update(update)
      .eq('id', id);

    if (error) { toast.error('Failed to update'); return; }
    toast.success(action === 'approved' ? 'Approved!' : 'Rejected');
    setShares(prev => prev.filter(s => s.id !== id));
  };

  if (authLoading || checking) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Admin access required.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </button>

        <h1 className="font-display text-xl font-bold mb-1">Social Post Moderation</h1>
        <p className="text-sm text-muted-foreground mb-6">Review and approve user-submitted social posts.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : shares.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending posts to review 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map(share => (
              <div key={share.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium">{share.display_name || share.username || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {share.platform} · {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    pending
                  </span>
                </div>

                {share.place_name && (
                  <p className="text-sm text-foreground mb-1">📍 {share.place_name}</p>
                )}
                {share.caption && (
                  <p className="text-sm text-foreground/70 mb-2">"{share.caption}"</p>
                )}

                <a
                  href={share.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-3"
                >
                  <ExternalLink className="w-3 h-3" /> Open original post
                </a>

                <div className="flex gap-2">
                  <Button size="sm" variant="hero" onClick={() => handleAction(share.id, 'approved')}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(share.id, 'rejected')}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
