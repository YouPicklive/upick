import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, Lock, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeName: string;
  initialRating?: number;
  initialContent?: string;
  initialNote?: string;
  onSubmit: (data: { rating: number; content: string | null; note: string | null; is_public: boolean }) => Promise<boolean>;
}

export function ReviewModal({ open, onOpenChange, placeName, initialRating, initialContent, initialNote, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating ?? 5);
  const [content, setContent] = useState(initialContent ?? '');
  const [note, setNote] = useState(initialNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onSubmit({
      rating,
      content: content.trim() || null,
      note: note.trim() || null,
      is_public: true,
    });
    setSubmitting(false);
    if (success) {
      setRating(5);
      setContent('');
      setNote('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Rate {placeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Star rating */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= rating
                      ? 'text-accent fill-accent'
                      : 'text-muted-foreground/20'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Public review */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
              <MessageSquare className="w-3 h-3" /> Public review (optional)
            </label>
            <Textarea
              placeholder="Share your experience…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-[10px] text-muted-foreground/60 text-right mt-0.5">
              {content.length}/500
            </p>
          </div>

          {/* Private note */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
              <Lock className="w-3 h-3" /> Private note (only you)
            </label>
            <Input
              placeholder="A note just for yourself…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? 'Saving…' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
