import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface HostLobbyScreenProps {
  sessionId: string;
  expectedVoters: number;
  currentVoters: number;
  onFinalize: () => void;
  finalizing?: boolean;
}

export function HostLobbyScreen({
  sessionId,
  expectedVoters,
  currentVoters,
  onFinalize,
  finalizing = false,
}: HostLobbyScreenProps) {
  const [copied, setCopied] = useState(false);

  const voteUrl = `${window.location.origin}/vote/${sessionId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vote on You Pick!',
          text: 'Help us decide — tap to vote!',
          url: voteUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">📲</span>
          <h1 className="font-display text-2xl font-bold mb-2">Group Vote</h1>
          <p className="text-muted-foreground text-sm">Share the link so everyone can vote from their phone</p>
        </div>

        {/* Share actions */}
        <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
          <div className="flex gap-3">
            <Button variant="hero" size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Vote Link
            </Button>
            <Button variant="outline" size="lg" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="mt-3 bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground break-all select-all text-center">
            {voteUrl}
          </div>
        </div>

        {/* Vote counter */}
        <div className="bg-card rounded-2xl p-5 shadow-card mb-4 text-center">
          <p className="text-muted-foreground text-xs mb-2">Votes received</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-display text-4xl font-bold text-primary">{currentVoters}</span>
            <span className="text-muted-foreground text-lg">/</span>
            <span className="text-muted-foreground text-2xl">{expectedVoters}</span>
          </div>
          {currentVoters < expectedVoters && (
            <p className="text-muted-foreground text-xs mt-2 animate-pulse">Waiting for votes…</p>
          )}
        </div>

        {/* Finalize */}
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={onFinalize}
          disabled={finalizing || currentVoters === 0}
        >
          {finalizing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Finalizing…
            </>
          ) : (
            '🎯 Finalize & Spin'
          )}
        </Button>

        {currentVoters === 0 && (
          <p className="text-center text-muted-foreground text-xs mt-3">
            At least 1 vote needed to finalize
          </p>
        )}
      </div>
    </div>
  );
}
