import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Standardized empty state component */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <h2 className="font-display text-lg font-bold mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="hero" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
