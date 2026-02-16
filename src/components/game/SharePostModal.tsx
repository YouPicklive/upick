import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Instagram, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'tiktok', label: 'TikTok', icon: ExternalLink },
  { value: 'x', label: 'X / Twitter', icon: ExternalLink },
  { value: 'facebook', label: 'Facebook', icon: ExternalLink },
  { value: 'other', label: 'Other', icon: ExternalLink },
];

interface SharePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function SharePostModal({ open, onClose }: SharePostModalProps) {
  const { user } = useAuth();
  const [platform, setPlatform] = useState('instagram');
  const [postUrl, setPostUrl] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user || !postUrl.trim()) return;

    // Basic URL validation
    try {
      new URL(postUrl.trim());
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('social_shares' as any).insert({
      user_id: user.id,
      platform,
      post_url: postUrl.trim(),
      place_name: placeName.trim() || null,
      caption: caption.trim() || null,
      status: 'pending',
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit. Try again.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setPostUrl('');
      setPlaceName('');
      setCaption('');
      setPlatform('instagram');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl p-6 animate-fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">Submitted for review!</h3>
            <p className="text-sm text-muted-foreground mt-1">Your post will appear once approved.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-lg font-bold mb-1">Share a Social Post</h3>
            <p className="text-sm text-muted-foreground mb-5">Link to your post about a local spot. It'll appear after review.</p>

            {/* Platform selector */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Platform</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      platform === p.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post URL */}
            <div className="mb-4">
              <Label htmlFor="post-url" className="text-xs text-muted-foreground mb-1.5 block">Post URL *</Label>
              <Input
                id="post-url"
                placeholder="https://instagram.com/p/..."
                value={postUrl}
                onChange={e => setPostUrl(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Place name */}
            <div className="mb-4">
              <Label htmlFor="place-name" className="text-xs text-muted-foreground mb-1.5 block">Place or business name</Label>
              <Input
                id="place-name"
                placeholder="e.g. The Roosevelt"
                value={placeName}
                onChange={e => setPlaceName(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Caption */}
            <div className="mb-5">
              <Label htmlFor="caption" className="text-xs text-muted-foreground mb-1.5 block">Caption (optional)</Label>
              <Input
                id="caption"
                placeholder="What did you love about it?"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={200}
                className="text-sm"
              />
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !postUrl.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit for Review
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
